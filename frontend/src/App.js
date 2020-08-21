import React, { useEffect, useState } from 'react';
import './App.css';


import { Container, Paper, Grid} from '@material-ui/core';
import { Alert as MuiAlert } from '@material-ui/lab';

import OkdbClient from "okdb-client";
import cloneDeep from 'lodash/cloneDeep';
import Designer from "react-designer";
import initialObjects from "./initialObjects";
import MousePointer from './MousePointer';

const HOST = "http://localhost:7899"; // location of your server, use xxxxx to use sample, or follow this guide to build your own:
const TOKEN = "12345"; // either get it from your auth provider and validate with system integration, or use default system users:
const okdb = new OkdbClient(HOST, { timeout:30000 });

window.okdb = okdb;
const DATA_TYPE="todo-tasks"; // data type, typically corresponds to the table name
const DOCUMENT_ID = "design-doc1"; // id of the object to be edited collaboratively


const Alert = (props)  => {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
};

function App() {
  const [doc, setDoc] = useState(null); 
  const [presences, setPresences] = useState({});
  const [error, setError] = useState(null);
  const [localObjects, setLocalObjects] = useState([]);

  const presenceCallback = (id, data) => { // callback to recieve status changes of other collaborators
    if(!data) {
      setPresences(prev => {        
        const newState = cloneDeep(prev);
        delete newState[id];
        return newState;
      })
    } else if(data.user && data.user.id) {
      setPresences(prev => {
        const newState = cloneDeep(prev);             
        newState[id] = {
          id,
          ...data
        };
        return newState;
      });
    }
  };

  const updateCallback = (data, meta) => { // callback to receive changes from others
    //console.log("updateCallback: ", data, JSON.stringify(meta));    
    const newDoc = cloneDeep(data);      
    setDoc(newDoc);
    setLocalObjects(newDoc.objects);
  };
  
  useEffect(() => {
    // 1. step - connect
    
    okdb.connect(TOKEN)
      .then(user => {
        console.log("[okdb] connected as ", user);
        // 2. step - open document for collaborative editing
        const defaultValue = { objects: initialObjects };       
        

        okdb.open(DATA_TYPE, // collection name
          DOCUMENT_ID,
          defaultValue, // default value to save if doesn't exist yet
          updateCallback, 
          presenceCallback)
          .then(data => { // get data of opened doc
            console.log("Loaded doc from server ", data)
            setDoc(data);
            if(data.objects) setLocalObjects(data.objects);
          })
          .catch(err => { console.log("Error opening doc ", err)});     
            
      })       
      .catch(err => {
        console.error("[okdb] error connecting ", err);
        setError(err.message ? err.message : err);
      });
  }, []);

  const updateDoc = (newDoc) => {
    setLocalObjects(newDoc.objects);
    okdb.put(DATA_TYPE, DOCUMENT_ID, newDoc)
    .then(res => {
      console.log("doc saved, ", res);
      setDoc(cloneDeep(res));      
    })
    .catch((err) =>  console.log("Error updating doc", err));
  };

  useEffect(() => {
    const handler = e => { 
      const container = document.querySelector("#canvas-container");   
      if(!container) return;             
      const containerRect = container.getBoundingClientRect();  
      var left = e.clientX - containerRect.left;
      var top = e.clientY - containerRect.top;
      
      okdb.sendPresence({
        type: "cursor",
        target: "canvas",
        left,
        top,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
    }
  }, []);

  return (
    <Container maxWidth="md" className="container">
      <Grid container spacing={3}>        
        <Grid item md={9}>
          <h1>Collaborative Design</h1>          
         
          { error && <Alert severity="error">{error}</Alert>}
          { doc && doc.objects &&
            <Paper >
              <div id="canvas-container">
                <Designer width={500} height={500}                  
                  onUpdate={(objects) => updateDoc({ objects })}
                  objects={localObjects} />
              </div>
            </Paper>
          }          
          
        </Grid>
        <Grid item md={3}>
          <div class="online-panel">
            <h4>Online:</h4>
            <div className="online-item" key="000">
              <svg width="10" focusable="false" viewBox="0 0 10 10" aria-hidden="true" title="fontSize small"><circle cx="5" cy="5" r="5"></circle></svg>
              me
            </div>
            {Object.keys(presences).map((presenceId, index) => {              
              const presence = presences[presenceId];              
              let left = 0;
              let top = 0;
              if(presence.left != null) {
                const container = document.querySelector("#canvas-container");   
                if(container) {
                  const containerRect = container.getBoundingClientRect();                
                  top = containerRect.top + presence.top + "px";
                  left = containerRect.left + presence.left + "px";
                }                
              }
              const colors = [ "#5551FF", "#0FA958"];
              const userColor = colors[index%colors.length];
              return (
              <div className="online-item" key={presenceId}>
                <svg width="10" fill={userColor} focusable="false" viewBox="0 0 10 10" aria-hidden="true" title="fontSize small"><circle cx="5" cy="5" r="5"></circle></svg>
                {presence.user.name}
                { presence.left != null &&
                  <div id="cursor" className="cursor-block" style={{left, top}}>
                    <MousePointer color={userColor} />
                    <div className="cursor-name-container">
                      <div className="cursor-name" style={{backgroundColor: userColor}}>{presence.user.name}</div>
                    </div>
                  </div>
                }
              </div>              
              );
            })}
          </div>
        </Grid>
      </Grid>
      
    </Container>
  );
}

export default App;

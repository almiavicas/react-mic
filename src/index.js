import React, { useState } from "react";
import ReactDOM from "react-dom";
import Grid from "@material-ui/core/Grid";

import NavBar from "./components/NavBar/NavBar";
import Microphone from "./components/Microphone/Microphone";
import AudioPlayer from "./components/AudioPlayer/AudioPlayer";

import "./styles.css";
import axios from "axios";

function App() {
  const [files, setFiles] = useState([]);
  const [bucketUris, setBucketUris] = useState([]);

  const config = { headers: { 'Content-Type': 'multipart/form-data' } };
  
  const submitFile = async file => {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('http://localhost:9000/file-upload', formData, config);
      const bucketUri = response.data.Location;
      setBucketUris([...bucketUris, bucketUri]);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };
  
  const pushFile = file => {
    console.log(file);
    const _file = new File([file.blob], new Date().valueOf(), { type: file.blob.type });
    submitFile(_file);
    setFiles([...files, file]);
  };
  

  return (
    <>
      <NavBar />
      <Microphone pushFile={pushFile} />
      <Grid container direction="column" spacing={3}>
        {files.map((file, index) => (
          <Grid key={index} item>
            <AudioPlayer file={file} bucketUri={bucketUris[index]} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

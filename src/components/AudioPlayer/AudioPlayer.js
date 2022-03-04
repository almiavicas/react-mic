import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer";
import uuidv4 from "uuid/v4";

import { makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import Card from "@material-ui/core/Card";
import IconButton from "@material-ui/core/IconButton";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import StopIcon from "@material-ui/icons/Stop";
import ChatBubbleIcon from "@material-ui/icons/ChatBubble";
import ShareIcon from "@material-ui/icons/Share";
import FavoriteIcon from "@material-ui/icons/Favorite";
import { green, red, blue } from "@material-ui/core/colors";

import PauseIcon from "@material-ui/icons/Pause";
import Grid from "@material-ui/core/Grid";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import { Button, CircularProgress } from "@material-ui/core";
import axios from "axios";

const faces = [
  "http://i.pravatar.cc/300?img=1",
  "http://i.pravatar.cc/300?img=2",
  "http://i.pravatar.cc/300?img=3",
  "http://i.pravatar.cc/300?img=4"
];

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: 600,
    minWidth: 240,
    margin: "auto",
    transition: "0.3s",
    boxShadow: "0 8px 40px -12px rgba(0,0,0,0.3)",
    "&:hover": {
      boxShadow: "0 16px 70px -12.125px rgba(0,0,0,0.3)"
    }
  },
  media: {
    width: "100%"
  },
  list: {
    padding: 0
  },
  listItem: {
    //paddingBottom: 0
  },
  buttons: {
    padding: theme.spacing(1)
  },
  controls: {
    minWidth: "100px"
  },
  icon: {
    height: 18,
    width: 18
  },
  avatar: {
    display: "inline-block"
  }
}));
/*
avatar username ostalo layout sa grid

*/
function AudioPlayer({ file, bucketUri }) {
  const wavesurfer = useRef(null);

  const [playerReady, setPlayerReady] = useState(false);
  const [awsTranscription, setAwsTranscription] = useState(null);
  const [awsTranscribing, setAwsTranscribing] = useState(false);
  const [awsConfidence, setAwsConfidence] = useState(null);
  const [googleTranscription, setGoogleTranscription] = useState(null);
  const [googleTranscribing, setGoogleTranscribing] = useState(false);
  const [googleConfidence, setGoogleConfidence] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const wavesurferId = `wavesurfer--${uuidv4()}`;

  useEffect(() => {
    wavesurfer.current = WaveSurfer.create({
      container: `#${wavesurferId}`,
      waveColor: "grey",
      progressColor: "tomato",
      height: 70,
      cursorWidth: 1,
      cursorColor: "lightgray",
      barWidth: 2,
      normalize: true,
      responsive: true,
      fillParent: true
    });

    const wav = require("../../static/12346 3203.ogg");

    // console.log("wav", wav);
    wavesurfer.current.load(wav);

    wavesurfer.current.on("ready", () => {
      setPlayerReady(true);
    });

    const handleResize = wavesurfer.current.util.debounce(() => {
      wavesurfer.current.empty();
      wavesurfer.current.drawBuffer();
    }, 150);

    wavesurfer.current.on("play", () => setIsPlaying(true));
    wavesurfer.current.on("pause", () => setIsPlaying(false));
    window.addEventListener("resize", handleResize, false);
  }, []);

  useEffect(() => {
    console.log("file", file);
    if (file) {
      wavesurfer.current.load(file.blobURL);
    }
  }, [file]);

  const awsTranscribe = async () => {
    if (awsConfidence) return;
    console.log('awsTranscribe');
    setAwsTranscribing(true);
    setAwsTranscription(null);
    const formData = new FormData();
    formData.append('bucketUri', bucketUri);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const response = await axios.post('http://localhost:9000/file-transcribe', formData, config);
      console.log(response);
      const { data: { results: { transcripts, items } } } = response;
      setAwsTranscription(transcripts[0].transcript);
      const pronunciationItems = items.filter(item => item.type === "pronunciation");
      console.log(pronunciationItems);
      const sum = pronunciationItems.reduce((prev, curr) => prev + Number(curr.alternatives[0].confidence), 0);
      setAwsConfidence(sum / pronunciationItems.length);
      setAwsTranscribing(false);
    } catch (e) {
      console.error(e);
      setAwsTranscribing(false);
      setAwsTranscription('Could not transcribe');
    }
  }

  const googleTranscribe = async () => {
    if (googleConfidence) return;
    console.log('googleTranscribe');
    setGoogleTranscribing(true);
    setGoogleTranscription(null);
    const formData = new FormData();
    const _file = new File([file.blob], new Date().valueOf(), { type: file.blob.type });
    formData.append('file', _file);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const response = await axios.post('http://localhost:9000/google-transcribe', formData, config);
      console.log(response);
      const { data: { results } } = response;
      const transcription = results.map(result => result.alternatives[0].transcript).join(' ');
      const confidence = results.reduce((acum, curr) => acum + curr.alternatives[0].confidence, 0) / results.length;
      setGoogleConfidence(confidence);
      setGoogleTranscription(transcription);
      setGoogleTranscribing(false);
    } catch (e) {
      console.error(e);
      setGoogleTranscribing(false);
      setGoogleTranscription('Could not transcribe');
    }
  }

  const togglePlayback = () => {
    if (!isPlaying) {
      wavesurfer.current.play();
    } else {
      wavesurfer.current.pause();
    }
  };

  const stopPlayback = () => wavesurfer.current.stop();

  const classes = useStyles();

  let transportPlayButton;

  if (!isPlaying) {
    transportPlayButton = (
      <IconButton onClick={togglePlayback}>
        <PlayArrowIcon className={classes.icon} />
      </IconButton>
    );
  } else {
    transportPlayButton = (
      <IconButton onClick={togglePlayback}>
        <PauseIcon className={classes.icon} />
      </IconButton>
    );
  }

  return (
    <>
      <Card className={classes.card}>
        <Grid container direction="column">
          <Grid item>
            <List className={classes.list}>
              <ListItem alignItems="flex-start" className={classes.listItem}>
                <ListItemAvatar>
                  <Avatar className={classes.avatar} src={faces[0]} />
                </ListItemAvatar>
                <ListItemText
                  primary="Username"
                  secondary="@username · 11h ago"
                />
              </ListItem>
              <ListItem className={classes.listItem}>
                { (awsTranscribing || awsTranscription) && <ListItemText
                    primary={awsTranscription || 'Transcribing...'}
                    secondary={awsConfidence && `AWS - confidence: ${Math.round(awsConfidence * 10000) / 100} %`}
                  />
                }
                {awsTranscribing && <CircularProgress />}
              </ListItem>
              <ListItem className={classes.listItem}>
                { (googleTranscribing || googleTranscription) && <ListItemText
                    primary={googleTranscription || 'Transcribing...'}
                    secondary={googleConfidence && `Google - confidence: ${Math.round(googleConfidence * 10000) / 100} %`}
                  />
                }
                {googleTranscribing && <CircularProgress />}
              </ListItem>
            </List>
          </Grid>
          <Grid item id={wavesurferId} />
          <Grid item container className={classes.buttons}>
            <Grid item xs={5}>
              {transportPlayButton}
              <IconButton onClick={stopPlayback}>
                <StopIcon className={classes.icon} />
              </IconButton>
            </Grid>
            <Grid item xs={7} container justify="space-around">
              <Grid item>
                <IconButton>
                  <FavoriteIcon
                    style={{ color: blue[500] }}
                    className={classes.icon}
                  />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton>
                  <ShareIcon
                    style={{ color: red[500] }}
                    className={classes.icon}
                  />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton>
                  <ChatBubbleIcon
                    style={{ color: green[500] }}
                    className={classes.icon}
                  />
                </IconButton>
              </Grid>
            </Grid>
          </Grid>
          <Grid item container className={classes.buttons}>
            <Grid item container justify="space-around">
              <Grid item>
                <Button onClick={awsTranscribe} disabled={awsTranscribing}>
                  Transcribe with AWS
                </Button>
              </Grid>
              <Grid item>
              <Button onClick={googleTranscribe} disabled={googleTranscribing}>
                  Transcribe with Google
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Card>
    </>
  );
}

export default AudioPlayer;

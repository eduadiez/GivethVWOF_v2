import React, { Component } from 'react'
import MediaCard from '../MediaCard'
import AddNewMediaButton from '../AddNewMediaButton'
import firebase from 'firebase';
import currentWeekNumber from 'current-week-number';

var config = {
  apiKey: "AIzaSyAGO0q7WjakjW2vNyxIVThAVPWxm-xozj8",
  authDomain: "givethvideowalloffame.firebaseapp.com",
  databaseURL: "https://givethvideowalloffame.firebaseio.com",
  projectId: "givethvideowalloffame",
  storageBucket: "givethvideowalloffame.appspot.com",
  messagingSenderId: "271393366127"
};

firebase.initializeApp(config);

class CampaignsVideosUploader extends Component {

  constructor(props) {
    super(props)
    var _week;

    var date = new Date();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();

    if(props.match.params.week != null){
      _week = props.match.params.week;
    }else{
      _week = currentWeekNumber() + "_" + month + "_" + year;
    }
    this.state = {
      databaseRef: firebase.database().ref("GVWOF/"+_week),
      media: [],
      week : _week
    }
  }

  //After the connect, what the state will do--gotdata
  componentDidMount() {
    this.state.databaseRef.on('value', this.gotData, this.errData);
    
  }

  //get the data from the firebase and push them out
  gotData = (data) => {
    var newMedia = []

    const mediadata = data.val();
    if(!mediadata)
      return
      
    const keys = Object.keys(mediadata);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      newMedia.push({
        id: keys[i], title: mediadata[k].name, src: mediadata[k].src, type: mediadata[k].type, ipfs: mediadata[k].ipfs, description: mediadata[k].description,timestamp: mediadata[k].timestamp,week: mediadata[k].week
      });
    }
    this.setState({ media: newMedia });
  }

  errData = (err) => {
    console.log(err);
  }


  render() {
    if (this.state.media.length > 0) {
      return (
        <div id="media-campaigns-view">
          <div className="container-fluid page-layout reduced-padding">
            <div className="card-columns">
              {
                this.state.media.map((media) => {
                  return (
                    // Load each video from the query into a card
                    <MediaCard
                      key={media.id}
                      id={media.id}
                      title={media.title}
                      src={media.src}
                      type={media.type}
                      ipfs={media.ipfs}
                      description={media.description}
                      timestamp={media.timestamp}
                      week={media.week}
                    />
                  )
                })
              }
            </div>
            <AddNewMediaButton  week={this.state.week}/>
          </div>
        </div>
      )
    } else {
      return (
        <div id="media-campaigns-view">
          <div className="container-fluid page-layout reduced-padding">
            <div className="card-columns">
              <p className="text-center">Loading or empty...</p>
            </div>
            <AddNewMediaButton week={this.state.week}/>
          </div>
        </div>
      )
    }
  }
}

export default CampaignsVideosUploader
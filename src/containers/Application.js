import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

// components
import MainMenu from './../components/MainMenu'

// views
import CampaignsVideosUploader from './../components/views/CampaignsVideosUploader.js'
import MediaCaptureiOS from './../components/views/MediaCapture_iOS.js'
import MediaCaptureWeb from './../components/views/MediaCapture_Web.js'
import CampaignsVideosViewer from './../components/views/CampaignsVideosViewer.js'

//import MediaCaptureWeb2 from './../components/views/MediaCapture_Web.js'

var isMobile = {
  Android: function () {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function () {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  iOS: function () {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function () {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function () {
    return navigator.userAgent.match(/IEMobile/i);
  },
  any: function () {
    return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
  }
};

class Application extends Component {
  render() {
    return (
      <Router  basename="/GivethVWOF">
        <div>
          <MainMenu />
          <div>
            {/* Routes are defined here. Persistent data is set as props on components */}
            <Switch>
             <Route exact path="/" component={CampaignsVideosUploader} />
              <Route exact path="/:week" component={CampaignsVideosUploader} />
              {
                isMobile.any() ?
                ( 
                  <Route exact path="/new/:week" component={(props) => (<MediaCaptureiOS appState={'value'} isNew={true} {...props} />)} />
                ) : (
                  <Route exact path="/new/:week" component={(props) => (<MediaCaptureWeb appState={'value'} isNew={true} {...props} />)} />
                )
              }
                isMobile.any() ?
                ( 
                  <Route exact path="/new" component={(props) => (<MediaCaptureiOS appState={'value'} isNew={true} {...props} />)} />
                ) : (
                  <Route exact path="/new" component={(props) => (<MediaCaptureWeb appState={'value'} isNew={true} {...props} />)} />
                )
              }
              <Route exact path="/view/:week/:id/" component={CampaignsVideosViewer} />
              
              </Switch>
          </div>
        </div>
      </Router>
    );
  }
}

export default Application;

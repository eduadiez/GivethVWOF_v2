import React, { Component } from 'react';
import PropTypes from 'prop-types'
import firebase from 'firebase';
import RecordRTC from 'recordrtc';
import GoBackButton from '../GoBackButton'

const database = firebase.database();

function hasGetUserMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

class MediaCapture_Web extends Component {

    constructor(props) {
        super(props);

        this.state = {
            file: null,
            src: null,
            blob: null,
            isVideo: false,
            isImage: false,
            upload: false,
            uploading: false,
            uploadSuccess: false,
            databaseRef: firebase.database().ref('media'),
            media: null,
            recording: false,
            isRecording: false,
            ipfsId: '',
            isScreenSharing: false,
            isCamera: false,
            isExtensionInstalled: true,
            stream: null,
            screenStream: null,
            cameraStream: null,
            mixedStream: null,
            title: "",
            description: ""
        };

        this.uploadFile = this.uploadFile.bind(this);
        this.uploadRecording = this.uploadRecording.bind(this);
        this.handleFile = this.handleFile.bind(this);
        this.startRecord = this.startRecord.bind(this);
        this.stopRecord = this.stopRecord.bind(this);
        this.upload = this.upload.bind(this);
        this.handleCheckBoxChange = this.handleCheckBoxChange.bind(this);
        this.getScreenSharing = this.getScreenSharing.bind(this);
        this.getBoth = this.getBoth.bind(this);

    }

    componentDidMount() {
        if (!hasGetUserMedia()) {
            alert("Your browser cannot stream from your webcam. Please switch to Chrome or Firefox.");
            return;
        }
    }

    handleFile(event) {
        this.setState({ isRecording: false });
        this.setState({
            file: event.target.files[0],
            src: URL.createObjectURL(event.target.files[0])
        });
        if (event.target.files[0].type.includes('video')) {
            this.setState({
                isVideo: true,
                isImage: false,
                upload: true
            });
        } else if (event.target.files[0].type.includes('image')) {
            this.setState({
                isVideo: false,
                isImage: true,
                upload: true
            });
        }
    }

    startRecord() {
        var self = this;

        var _stream;
        if (this.state.isScreenSharing && this.state.isCamera) {
            _stream = this.state.stream.getMixedStream()
        } else {
            _stream = this.state.stream
        }

        self.setState({
            recordVideo: RecordRTC(_stream, {
                type: 'video', previewStream: function (s) {
                    document.querySelector('video').muted = true;
                    window.setSrcObject(s, document.querySelector('video'));
                }
            })
        }, function () {
            self.state.recordVideo.startRecording();
        });

        window.setSrcObject(_stream, document.querySelector('video'));
        this.setState({ recording: true, isRecording: true });
    }

    stopRecord() {
        this.setState({ recording: false });
        this.setState({ upload: true });
        this.state.recordVideo.stopRecording(() => {

            this.setState({
                src: window.URL.createObjectURL(this.state.recordVideo.blob),
                blob: this.state.recordVideo.blob
            });

            console.log("storageRef")
            console.log(this.state.recordVideo.blob)

        });
    }

    upload() {
        this.setState({ upload: false, uploading: true })
        if (this.state.isRecording) {
            let reader = new FileReader()
            reader.onloadend = () => this.saveToIpfs(reader)
            reader.readAsArrayBuffer(this.state.blob)
            //this.uploadRecording();

        } else {
            //this.uploadFile();

            let reader = new FileReader()
            reader.onloadend = () => this.saveToIpfs(reader)
            reader.readAsArrayBuffer(this.state.file)
        }
    }

    saveToIpfs = (reader) => {
        // console.log(this.arrayBufferToString(reader.result))
        //let ipfsId
        //const ipfs = new IPFS('localhost', '5001', { protocol: 'http' })
        const ipfs = new window.IpfsApi('35.188.240.194', '80', { protocol: 'http' })
        const buffer = Buffer.from(reader.result)
        ipfs.add(buffer)
            .then((response) => {
                //if (err) { console.log(err); return}
                console.log(response)
                this.setState({ ipfsId: response[0].hash })
                console.log(this.state.ipfsId)
                if (this.state.isRecording) {
                    this.uploadRecording();

                } else {
                    this.uploadFile();
                }
            })

    }

    arrayBufferToString = (arrayBuffer) => {
        return String.fromCharCode.apply(null, new Uint16Array(arrayBuffer))
    }

    uploadFile() {
        console.log(this.state.file)
        // Create a root reference
        var storageRef = firebase.storage().ref('/' + this.state.file.name);
        var name = this.state.file.name;
        var self = this;

        var timestamp = Date.now();
        var title = this.state.title;
        var description = this.state.description;

        console.log(timestamp + "_" + title + "_" + description)

        return



        this.setState({ upload: false, uploading: true }, function () {
            storageRef.put(self.state.file).then((snapshot) => {
                console.log('Uploaded a blob or file!');
                var _type = '';
                if (self.state.isImage) {
                    _type = 'image'
                } else {
                    _type = 'video'
                }

                storageRef.getDownloadURL().then((url) => {
                    console.log(url)

                    database.ref('media').push({
                        src: url,
                        name: name,
                        type: _type,
                        ipfs: 'http://35.188.240.194:8080/ipfs/' + self.state.ipfsId
                    }, function () {
                        console.log('upload')

                        if (this.state.cameraStream) {
                            this.state.cameraStream.stop()
                            this.setState({ cameraStream: null })
                        }
                        self.setState({
                            file: null,
                            src: null,
                            isVideo: false,
                            isImage: false,
                            upload: false,
                            uploading: false,
                            uploadSuccess: true
                        });
                        self.props.history.goBack();
                    });
                });
            });
        });

    }

    uploadRecording() {
        console.log(this.state.file)
        // Create a root reference
        var self = this
        var name = Math.floor(Math.random() * 90000) + 10000;
        var storageRef = firebase.storage().ref('/' + name);

        console.log("storageRef created!")
        this.setState({ upload: false, uploading: true });

        var timestamp = Date.now();
        var title = this.state.title;
        var description = this.state.description;

        console.log(timestamp + "_" + title + "_" + description)

        return


        storageRef.put(this.state.blob).then((snapshot) => {
            console.log('Uploaded a blob or file!');
            var _type = '';
            if (this.state.isImage) {
                _type = 'image'
            } else {
                _type = 'video'
            }

            storageRef.getDownloadURL().then((url) => {
                console.log(url)

                database.ref('media').push({
                    src: url,
                    name: name,
                    type: _type,
                    ipfs: 'http://35.188.240.194:8080/ipfs/' + self.state.ipfsId

                }, function () {

                    self.setState({
                        file: null,
                        src: null,
                        isVideo: false,
                        isImage: false,

                        upload: false,
                        uploading: false,
                        uploadSuccess: true
                    });

                    if (this.state.cameraStream) {
                        this.state.cameraStream.stop()
                        this.setState({ cameraStream: null })
                    }

                    self.props.history.goBack();

                });
            });
        });
    }

    handleCheckBoxChange(event) {
        switch (event.target.value) {
            case 'ScreenSharing':
                if (this.state.isScreenSharing) {
                    this.setState({ isScreenSharing: false, isVideo: true }, function () {
                        if (this.state.screenStream && !this.state.cameraStream) {
                            this.state.screenStream.stop()
                            this.setState({ screenStream: null }, this.getCamera())
                        }else if(this.state.screenStream && this.state.cameraStream){
                            this.selectedStream()  
                        }
                    })
                } else {
                    this.setState({ isScreenSharing: true, isVideo: true }, function () {
                        this.detectExtension(this)
                        if (!this.state.screenStream && !this.state.cameraStream) {
                            this.getScreenSharing()
                        } else if (!this.state.screenStream && this.state.cameraStream) {
                            this.getBoth()
                        } else {
                            this.selectedStream()
                        }
                    })
                }
                break;
            case 'Camera':
                if (this.state.isCamera) {
                    this.setState({ isCamera: false, isVideo: true }, function () {
                        if (this.state.screenStream && !this.state.screenStream) {
                            this.state.screenStream.stop()
                            this.setState({ screenStream: null }, this.selectedStream())
                        }else if(this.state.screenStream && this.state.screenStream){
                            this.selectedStream()  
                        }
                    })
                } else {
                    this.setState({ isCamera: true, isVideo: true }, function () {
                        if (!this.state.cameraStream && !this.state.screenStream) {
                            this.getCamera()
                        } else if (!this.state.cameraStream && this.state.screenStream) {
                            this.getBoth()
                        } else {
                            this.selectedStream()
                        }
                    })
                }
                break;

            default:
                break;
        }

    }

    getScreenSharing() {
        var self = this

        captureUserMedia((stream) => {
            window.getScreenId(function (error, sourceId, screen_constraints) {
                if (error) { console.log(error); return }
                navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
                navigator.mediaDevices.getUserMedia(screen_constraints).then(function (_screenStream) {

                    _screenStream.fullcanvas = true;
                    _screenStream.width = window.screen.width; // or 3840
                    _screenStream.height = window.screen.height; // or 2160 

                    self.setState({
                        screenStream: _screenStream
                    }, function () {
                        self.selectedStream()
                    })
                })
            })

        })
    }


    getCamera() {
        var self = this
        captureUserMedia((stream) => {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function (_cameraStream) {
                _cameraStream.width = 640;
                _cameraStream.height = 480;
                self.setState({
                    cameraStream: _cameraStream
                }, function () {
                    self.selectedStream()
                })
            })
        })
    }

    getBoth() {
        var self = this
        captureUserMedia((stream) => {
            window.getScreenId(function (error, sourceId, screen_constraints) {
                navigator.mediaDevices.getUserMedia(screen_constraints).then(function (screenStream) {
                    navigator.mediaDevices.getUserMedia({ video: true }).then(function (cameraStream) {
                        screenStream.fullcanvas = true;
                        screenStream.width = window.screen.width; // or 3840
                        screenStream.height = window.screen.height; // or 2160 

                        cameraStream.width = parseInt((20 / 100) * screenStream.width);
                        cameraStream.height = parseInt((20 / 100) * screenStream.height);
                        cameraStream.top = screenStream.height - cameraStream.height;
                        cameraStream.left = screenStream.width - cameraStream.width;

                        self.setState({
                            stream: new window.MultiStreamsMixer([screenStream, cameraStream])
                        }, function () {
                            self.state.stream.frameInterval = 1;
                            self.state.stream.startDrawingFrames();
                            window.setSrcObject(self.state.stream.getMixedStream(), document.querySelector('video'));
                        })
                    })
                })
            })
        })
    }

    selectedStream() {

        var self = this;
        if (this.state.isScreenSharing && this.state.isCamera) {
            if (this.state.stream) {
                this.setState({ stream: null }, function () {
                    var _cameraStream_ss = this.state.cameraStream;
                    _cameraStream_ss.width = parseInt((20 / 100) * this.state.screenStream.width);;
                    _cameraStream_ss.height = parseInt((20 / 100) * this.state.screenStream.height);
                    _cameraStream_ss.top = this.state.screenStream.height - _cameraStream_ss.height;
                    _cameraStream_ss.left = this.state.screenStream.width - _cameraStream_ss.width;
                    self.setState({
                        stream: new window.MultiStreamsMixer([this.state.screenStream, _cameraStream_ss])
                    }, function () {
                        self.state.stream.frameInterval = 1;
                        self.state.stream.startDrawingFrames();
                        window.setSrcObject(self.state.stream.getMixedStream(), document.querySelector('video'));
                    })
                })
            }
        } else if (this.state.isScreenSharing && !this.state.isCamera) {


                self.setState({
                    stream: new window.MultiStreamsMixer([this.state.screenStream])
                }, function () {
                    self.state.stream.frameInterval = 1;
                    self.state.stream.startDrawingFrames();
                    window.setSrcObject(self.state.stream.getMixedStream(), document.querySelector('video'));
                })
            
        } else if (!this.state.isScreenSharing && this.state.isCamera) {

            if (this.state.stream) {
                var _cameraStream = this.state.cameraStream;
                _cameraStream.width = 640;
                _cameraStream.height = 480;
                _cameraStream.top = 0;
                _cameraStream.left = 0;
                _cameraStream.fullcanvas = true;
                this.setState({
                    cameraStream: _cameraStream
                }, function () {
                    this.state.stream.resetVideoStreams([this.state.cameraStream])
                })

            } else {
                self.setState({
                    stream: new window.MultiStreamsMixer([this.state.cameraStream])
                }, function () {
                    self.state.stream.frameInterval = 1;
                    self.state.stream.startDrawingFrames();
                    window.setSrcObject(self.state.stream.getMixedStream(), document.querySelector('video'));
                })
            }
        } else if (!this.state.isScreenSharing && !this.state.isCamera) {
            this.setState({ isVideo: false })
            if (this.state.cameraStream) {
                this.state.cameraStream.stop()
                this.setState({ cameraStream: null })
            }

            if (self.state.stream) {
                self.state.stream.releaseStreams();
                this.setState({ stream: null })
            }



        }
    }

    detectExtension(self) {
        if (!!navigator.mozGetUserMedia) return;

        var extensionid = 'ajhifddimkapgcifgcodmmfdlknahffk';

        var image = document.createElement('img');
        image.src = 'chrome-extension://' + extensionid + '/icon.png';
        image.onload = function () {
            //DetectRTC.screen.chromeMediaSource = 'screen';
            window.postMessage('are-you-there', '*');
            setTimeout(function () {
                //if (!DetectRTC.screen.notInstalled) {
                //callback('installed-enabled');
                //alert('Not Installed')
                //}
            }, 2000);
        };
        image.onerror = function () {
            //DetectRTC.screen.notInstalled = true;
            //callback('not-installed');
            self.setState({ isExtensionInstalled: false })
        };
    }

    onChangeTitle(event) {
        this.setState({ title: event.target.value });
        console.log(event.target.value)
    }

    onChangeDescription(event) {
        this.setState({ description: event.target.value });
        console.log(event.target.value)
    }

    render() {
        const history = this.props.history

        return (
            <div className="container-fluid page-layout">
                <div className="row justify-content-md-center">
                    <div className="col-md-auto">
                        <GoBackButton history={history} />
                        <h1>Upload a new video or picture</h1>
                        {this.state.uploading ? <div>Uploading...</div> : null}
                        <div className="alert alert-danger" role="alert" style={{ display: this.state.isExtensionInstalled ? 'none' : 'block' }}>
                            <strong>You need install a </strong>
                            <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk" className="alert-link">Chrome extension</a> and reload
                        </div>
                        <div className="form-group" style={{ display: this.state.upload ? 'block' : 'none' }}>
                            <button type="button" className="btn btn-success" onClick={this.upload}>
                                Upload
                            </button>
                        </div>
                        <div className="form-group">
                            <label>Title:</label>
                            <input
                                className="form-control"
                                name="title"
                                id="title-input"
                                type="text"
                                value={this.state.title}
                                onChange={this.onChangeTitle.bind(this)}
                                placeholder="E.g. Climate change."
                            />
                        </div>
                        <div className="form-group">
                            <label>Description:</label>
                            <input
                                className="form-control"
                                name="description"
                                id="description-input"
                                type="text"
                                value={this.state.description}
                                onChange={this.onChangeDescription.bind(this)}
                                placeholder="Descrption of Climate change."
                            />
                        </div>
                        <div className="form-group" >
                            <div className="form-check form-check-inline">
                                <label className="form-check-label">
                                    <input className="form-check-input" type="checkbox" id="cameraCheckBox" value="Camera" onChange={this.handleCheckBoxChange} /> Camera
                                </label>
                            </div>
                            <div className="form-check form-check-inline">
                                <label className="form-check-label">
                                    <input className="form-check-input" type="checkbox" id="screenSharingCheckBox" value="ScreenSharing" onChange={this.handleCheckBoxChange} /> Screen sharing
                                </label>
                            </div>
                        </div>

                        <div className="form-group" >
                            <video
                                id='video'
                                width="640"
                                loop
                                controls autoPlay muted
                                style={{ display: this.state.isVideo ? 'block' : 'none' }}
                                src={this.state.src} />
                            <img
                                src={this.state.src}
                                style={{ display: this.state.isImage ? 'block' : 'none' }}
                                className="img-responsive"
                                alt=""
                                width="240" />
                        </div>
                        <div className="form-group" >
                            <button
                                className="btn btn-success"
                                onClick={this.startRecord}
                                style={{ display: this.state.recording ? 'none' : 'block' }}>
                                Start Record
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={this.stopRecord}
                                style={{ display: this.state.recording ? 'block' : 'none' }}>
                                Stop Record
                            </button>
                        </div>
                        <div className="form-group">
                            <input type="file" accept="image/*;video/*" onChange={this.handleFile} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

// handle user media capture
export function captureUserMedia(callback) {
    var params = { audio: true, video: true };

    navigator.getUserMedia(params, callback, (error) => {
        alert(JSON.stringify(error));
    });
};


export default MediaCapture_Web;

MediaCapture_Web.propTypes = {
    history: PropTypes.object.isRequired,
}
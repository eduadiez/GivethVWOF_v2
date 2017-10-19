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

class MediaCapture_iOS extends Component {

    constructor(props) {
        super(props);

        this.state = {
            file: null,
            src: null,
            blob: null,
            isVideo: true,
            isImage: false,
            showInput: true,
            upload: false,
            uploading: false,
            uploadSuccess: false,
            databaseRef: firebase.database().ref('media'),
            media: null,
            recording: false,
            isRecording: false,
            ipfsId: ''
        };

        this.uploadFile = this.uploadFile.bind(this);
        this.handleFile = this.handleFile.bind(this);
        this.startRecord = this.startRecord.bind(this);
        this.stopRecord = this.stopRecord.bind(this);
        this.upload = this.upload.bind(this);
    }

    componentDidMount() {

        if (!hasGetUserMedia()) {
            alert("Your browser cannot stream from your webcam. Please switch to Chrome or Firefox.");
            return;
        }
        this.requestUserMedia();
    }



    requestUserMedia() {
        console.log('requestUserMedia')
        captureUserMedia((stream) => {

            window.getScreenId(function (error, sourceId, screen_constraints) {
                navigator.mediaDevices.getUserMedia(screen_constraints).then(function (screenStream) {
                    navigator.mediaDevices.getUserMedia({ video: true }).then(function (cameraStream) {

                        screenStream.width = window.screen.width;
                        screenStream.height = window.screen.height;
                        screenStream.fullcanvas = true;


                        cameraStream.width = 320;
                        cameraStream.height = 240;
                        cameraStream.top = screenStream.height - cameraStream.height;
                        cameraStream.left = screenStream.width - cameraStream.width;


                        var mixer = new window.MultiStreamsMixer([screenStream, cameraStream]);

                        mixer.frameInterval = 1;
                        mixer.startDrawingFrames();

                        window.setSrcObject(mixer.getMixedStream(), document.querySelector('video'));

                    })
                })
            })




            this.setState({ src: window.URL.createObjectURL(stream) });
            console.log('setting state', this.state)
        });
    }

    handleFile(event) {

        this.setState({ isRecording: false });
        console.log(event.target.files[0])
        this.setState({
            file: event.target.files[0],
            src: URL.createObjectURL(event.target.files[0])
        });
        if (event.target.files[0].type.includes('video')) {
            this.setState({
                isVideo: true,
                isImage: false,
                showInput: false,
                upload: true
            });
        } else if (event.target.files[0].type.includes('image')) {
            this.setState({
                isVideo: false,
                isImage: true,
                showInput: false,
                upload: true
            });
        }
    }

    startRecord() {
        var self = this;
        captureUserMedia((stream) => {
            window.getScreenId(function (error, sourceId, screen_constraints) {
                navigator.mediaDevices.getUserMedia(screen_constraints).then(function (screenStream) {
                    navigator.mediaDevices.getUserMedia({ video: true }).then(function (cameraStream) {

                        screenStream.width = window.screen.width;
                        screenStream.height = window.screen.height;
                        screenStream.fullcanvas = true;


                        cameraStream.width = 320;
                        cameraStream.height = 240;
                        cameraStream.top = screenStream.height - cameraStream.height;
                        cameraStream.left = screenStream.width - cameraStream.width;

                        //self.setState({ src: window.URL.createObjectURL([cameraStream, screenStream]), isVideo: true, isImage: false });
                        self.setState({
                            recordVideo: RecordRTC([screenStream, cameraStream], {
                                type: 'video', previewStream: function (s) {
                                    document.querySelector('video').muted = true;
                                    window.setSrcObject(s, document.querySelector('video'));
                                }
                            })
                        });
                        self.state.recordVideo.startRecording();
                    })
                })
            })
        })

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
                this.setState({ipfsId : response[0].hash})
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
        console.log("storageRef created!")
        this.setState({ upload: false, uploading: true });
        storageRef.put(this.state.file).then((snapshot) => {
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
                    ipfs: 'http://35.188.240.194:8080/ipfs/' + this.state.ipfsId
                });
            });

            this.setState({
                file: null,
                src: null,
                isVideo: false,
                isImage: false,
                showInput: true,
                upload: false,
                uploading: false,
                uploadSuccess: true
            });

            this.props.history.goBack();
        });
    }



    uploadRecording() {
        console.log(this.state.file)
        // Create a root reference
        var name = Math.floor(Math.random() * 90000) + 10000;
        var storageRef = firebase.storage().ref('/' + name);

        console.log("storageRef created!")
        this.setState({ upload: false, uploading: true });

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
                    ipfs: 'http://35.188.240.194:8080/ipfs/' + this.state.ipfsId

                });
            });

            this.setState({
                file: null,
                src: null,
                isVideo: false,
                isImage: false,
                showInput: true,
                upload: false,
                uploading: false,
                uploadSuccess: true
            });

            this.props.history.goBack();
        });
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


                        <div className="form-group">
                            <button type="button" style={{ display: this.state.upload ? 'block' : 'none' }} className="btn btn-success" onClick={this.upload}>
                                Upload
                            </button>
                        </div>
                        <div className="form-group" >
                            <div class="form-check form-check-inline">
                                <label class="form-check-label">
                                    <input class="form-check-input" type="checkbox" id="inlineCheckbox1" value="option1" /> Screen sharing
                                </label>
                            </div>
                            <div class="form-check form-check-inline">
                                <label class="form-check-label">
                                    <input class="form-check-input" type="checkbox" id="inlineCheckbox2" value="option2" /> Webcam
                                </label>
                            </div>
                            <div class="form-check form-check-inline disabled">
                                <label class="form-check-label">
                                    <input class="form-check-input" type="checkbox" id="inlineCheckbox3" value="option3" disabled />
                                </label>
                            </div>
                        </div>

                        <div className="form-group" >
                            <video id='video' width="640" height="480" controls autoPlay muted style={{ display: this.state.isVideo ? 'block' : 'none' }} loop src={this.state.src} />
                            <img src={this.state.src} style={{ display: this.state.isImage ? 'block' : 'none' }} className="img-responsive" alt="" width="240" />
                        </div>
                        <div className="form-group" >
                            <button className="btn btn-success" onClick={this.startRecord} style={{ display: this.state.recording ? 'none' : 'block' }}>Start Record</button>
                            <button className="btn btn-danger" onClick={this.stopRecord} style={{ display: this.state.recording ? 'block' : 'none' }}>Stop Record</button>
                        </div>
                        <div className="form-group" style={{ display: this.state.showInput ? 'block' : 'none' }}>
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


export default MediaCapture_iOS;

MediaCapture_iOS.propTypes = {
    history: PropTypes.object.isRequired,
}
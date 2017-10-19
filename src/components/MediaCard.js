import React, { Component } from 'react'

class MediaCard extends Component {

    constructor(props) {
        super(props)
        this.state = {
            src: props.src,
            id: props.id,
            type: props.type,
            ipfs: props.ipfs,
            title: props.title,
            timestamp: props.timestamp,
            description: props.description,
            date: new Date(props.timestamp).toString()
        }
    }

    render() {

        var mediaContent = null;
        if (this.state.type === "video") {
            mediaContent = <video controls autoPlay muted loop src={this.state.src} className="card-img-top" />;
        } else {
            mediaContent = <img src={this.state.src} className="card-img-top" alt="" />
        }

        return (
            <div className="card">
                {mediaContent}
                <div className="card-body">
                    <h1 className="card-title">{this.props.title}</h1>
                    <p>
                        {this.props.description}
                    </p>
                    <div className="card-text">

                        <p>
                            {this.state.date}
                        </p>

                        <h3>Link</h3>
                        <a href={'https://eduadiez.github.io/GivethVWOF/view/' + this.props.week + "/" + this.props.id}>{'https://eduadiez.github.io/GivethVWOF/view/' + this.props.week + "/" + this.props.id}</a>
                        <p />
                        <h3>IPFS</h3>
                        <a href={this.state.ipfs}>{this.state.ipfs}</a>
                        <p />
                        <h3>Firebase</h3>
                        <a href={this.props.src}>{this.props.src}</a>
                    </div>
                </div>
            </div>
        )
    }
}

export default MediaCard


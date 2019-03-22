import React,{ Component } from 'react';

class Message extends Component {
    state = {
        onHover: false,
    }

    onHover = () => {
        this.setState({
            onHover: true
        });
    }

    onOut = () => {
        this.setState({
            onHover: false
        });
    }
    
    render(){
        return (
            <div style={{ width: '100%',height: '96px',padding: '16px',marginBottom: '1px',paddingBottom: 0}}>
                
                <div style={{float: this.props.isMe ? 'right' : 'left',height: '100%',fontSize: 18,cursor: 'pointer', display: 'inline-block' }} onMouseOver={this.onHover} onMouseOut={this.onOut}>
                    <div style={{ float: this.props.isMe ? 'right' : 'left', marginBottom: '24px' }}>
                        {`${this.props.name}`}
                        <span style={{ color: 'gray',marginLeft: '8px' }}>{`${this.props.sentAt.split('T')[0]} ${this.props.sentAt.split('T')[1].substr(0,8)}`}</span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)',width: '100%',height: '64px',borderRadius: '8px',padding: '16px', marginTop: '32px'}}>{this.props.message}</div>
                </div>
            </div>
        );
    }
}

export default Message;

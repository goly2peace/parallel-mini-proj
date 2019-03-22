import React,{ Component } from 'react';
const min = (a,b) => {
    return a < b ? a : b;
}
class GroupRow extends Component {
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
            <div style={{ width: '100%', height: '98px' }} onClick={() => this.props.onClick(this.props.gid,this.props.name)}>
                <div style={{ marginBottom: '1px',width: '100%', height: '96px', padding: '16px',cursor: 'pointer',backgroundColor: this.state.onHover || this.props.isSelected ? 'rgba(0, 0, 0, 0.1)' : '#f2f2f2' }} onMouseOver={this.onHover} onMouseOut={this.onOut}>
                    <div style={{fontSize: '18px',display: 'inline-block' }}>
                        { this.props.name } 
                        {
                            this.props.groupNumber != undefined && this.props.groupNumber != 0 && ` (${this.props.groupNumber ? this.props.groupNumber : 0})`
                        }
                    </div> 
                    <div style={{fontSize: '12px', paddingTop: '8px',color: 'rgba(0, 0, 0, 0.5)'}}>{`${this.props.lastMessage.substr(0,min(this.props.lastMessage.length,48))}${this.props.lastMessage.length >= 48 ? `...` : ``}`}</div> 
                </div>
                <div style={{ width: '100%',backgroundColor: 'rgba(0, 0, 0, 0.1)',height: '1px',padding: '0px',margin: '0px' }} />
            </div>
        );
    }
}

export default GroupRow;

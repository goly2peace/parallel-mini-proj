import './styleMain.css';
import './style.css';

import * as Scroll from 'react-scroll';
import {Link,Element,Events,animateScroll as scroll,scrollSpy, scroller} from 'react-scroll'

import {ModalContainer,ModalDialog} from 'react-modal-dialog';
import React,{Component} from 'react';

import Cookies from 'universal-cookie';
import GroupRow from '../GroupRow';
import IpList from '../config/ip';
import Message from '../Message';
import PropTypes from 'prop-types';
import axios from 'axios';
import io from 'socket.io-client';

const cookies = new Cookies();
const querystring = require('querystring');
class Main extends Component {

    socket = io(IpList.socketServer);
    
    state = {
        isJoin : [],
        text: '',
        messages: [],
        lastMessage: {},
        unread: {},
        nameOfuser: {},
        groupList: [],
        joinedGroups: [],
        isShowingModal: false,
        newGroupName: '',
        selectedGroupID: '',
        selectGroupName: '', 
        messageOrder: -1,
    };
    componentDidMount() {
        axios.get(IpList.loadBalancer + '/getMessageOrder').then((res) => {
            
            this.setState({messageOrder: res.data.messageOrder}, () => {

                this.socket.on('chat',(result) => {

                    if (this.state.messageOrder + 1 == result.messageOrder) {

                        this.setState({
                            messageOrder: result.messageOrder
                        });

                        let messages = this.state.messages.slice();
                        let lastMessage = this.state.lastMessage;
                        //  message = { ...message,user: { uid: message.uid ,username:message.user.name} };
                        messages.push({ ...result.message,
                            user: {
                                uid: result.message.uid,
                                username: result.message.user.name
                            }
                        });
                        lastMessage[result.message.gid] = result.message.content;
                        this.setState({
                            messages,
                            lastMessage
                        });

                        if (this.state.selectedGroupID == result.message.gid) {
                            axios.post(IpList.loadBalancer + '/setReadAt', {
                                uid: cookies.get('uid'),
                                gid: result.message.gid

                            }).then(() => {

                                this.getUnread(result.message.gid);
                            });
                        }

                        this.getUnread(result.message.gid);
                        this.getJoinedGroups();
                    } else {
                        this.getAllGroup();
                        this.getJoinedGroups();
                    }
                });
            });
        });

        this.getAllGroup();
        this.getJoinedGroups();

        const node = this.refs.trackerRef;
        node && node.scrollIntoView({block: "end"})

    }

    getUnread = (gid) => {

        axios.get(IpList.loadBalancer + '/viewUnreadMessages?uid=' + cookies.get('uid') + '&gid=' + gid).then((res) => {
            let unread = this.state.unread;
            
            unread[gid] = res.data.messages.length;
            this.setState({
                unread
            });
        })
    }
    
    getAllUser = () => {
        axios.get(IpList.loadBalancer + '/getAllGroup').then(function (response) {
            this.setState({ groupList: response.data }, this.getMessage)

        }.bind(this)).catch(function (err) {
            console.error(err);
        });
    }

    getJoinedGroups = () => {
        axios.get(IpList.loadBalancer + `/getUserInfo?uid=${cookies.get('uid')}`).then((res) => {

            const myData = res.data.groups.length ? [...res.data.groups].sort((x, y) => x.name.localeCompare(y.name) ) : [];
            this.setState({
                joinedGroups: myData
            });
        });
    }
    

    selectGroup = (gid, gname) => {
        // console.log("!! " + this.state.isJoin[gid])

        const GID = gid;
        this.setState({
            selectedGroupID: GID,
            selectGroupName: gname
        });

        axios.post(IpList.loadBalancer + '/joinGroup', {
            uid: cookies.get('uid'),
            gid: GID 
        }).then(function (response) {
            // console.log('JOIN GROUP SUCCESS');

            this.getJoinedGroups();

            axios.post(IpList.loadBalancer + '/setReadAt', {
                uid: cookies.get('uid'),
                gid: GID
            }).then(() => {

                this.getUnread(GID);

            });
        }.bind(this)).catch(function(err) {
            console.error(err);
            axios.post(IpList.loadBalancer + '/setReadAt', {
                uid: cookies.get('uid'),
                gid: GID
            }).then(() => {

                this.getUnread(GID);
            });
        });
    }
    

    getMessage = async () => {
        let messages = this.state.messages;
        await this.state.groupList.map((group) => {
            // console.log('sdasdsadsadsadsa')

            axios.get(IpList.loadBalancer + '/viewUnreadMessages?uid=' + cookies.get('uid') + '&gid=' + group._id).then((res) => {

                axios.get(IpList.loadBalancer + '/getAllMessage', { params: { gid: group._id } }).then(function (response) {

                    response.data.messages.map((message) => {

                        message = { ...message,user: { uid: message.uid,username:message.user.name} };
                        messages.push(message);
                    })
                    let lastMessage = this.state.lastMessage;
                    let unread = this.state.unread;

                    unread[group._id] = res.data.messages.length;
                    lastMessage[group._id] = response.data.messages[response.data.messages.length - 1].content;

                    this.setState({lastMessage,unread });
                }.bind(this)).catch(function (err) {
                    console.error(err);
                });
            }, (err) => { console.error(err)});
        })

        this.setState({ messages });
    }

    getAllGroup = () => {
        axios.get(IpList.loadBalancer + '/getAllGroup').then(function (response) {
            const myData = [...response.data].sort((x, y) => x.name.localeCompare(y.name))
            this.setState({ groupList: myData },this.getMessage);

        }.bind(this)).catch(function (err) {
            console.error(err);

        });
    }

    componentDidUpdate() {
        const node = this.refs.trackerRef;
        node && node.scrollIntoView({block: "end"})
    }

    handleChange = (event) => {
        if(event.target.value[event.target.value - 1] !== '\n') {
            this.setState({ text: event.target.value });
        } else {
            this.setState({
                text: ''
            });
        }
    };

    leaveGroup = (gid) => {
        axios.post(IpList.loadBalancer + '/leaveGroup', {
            uid: cookies.get('uid'),
            gid: gid,
        }).then((result) => {
            this.getJoinedGroups();
            this.setState({
                selectedGroupID: '',
                selectGroupName: '',
            });
        });
    }
    
    onLogOutClick = () => {
        window.location.assign('logout');
    };

    createGroup = () => {
        axios.post(IpList.loadBalancer + '/createGroup', {
            uid: cookies.get('uid'),
            gname: this.state.newGroupName,
        }).then(function (response) {
            
        }).catch(function (err) {
            console.error(err);
        });
    };

    handleCreateGroup = (event) => this.setState({ newGroupName: event.target.value });
    
    handleClick = () => this.setState({ isShowingModal: true });
    
    handleClose = () => this.setState({ isShowingModal: false });

    sendText = () => {
        scroller.scrollTo('Message', {
            duration: 1500,
            delay: 100,
            smooth: true,
            containerId: this.state.messages.length-1,
            offset: 50, // Scrolls to element + 50 pixels down the page
          });
        axios.post(IpList.loadBalancer + '/sendMessage', {
            uid: cookies.get('uid'),
            gid: this.state.selectedGroupID, // CHANGE gid MANUALLY
            content: this.state.text 
        }).then(function (response) {

        }).catch(function (err) {
            console.error(err);
        });

        this.setState({ text: '' });   
    }

    render() {
        return (
            <div style={{ width: '90%', height: '100vh' }}>
                <div className="row" style={{ height: '64px' }}>
                   
                </div>
                <div className="row">
                    <div className="col-md-3 no-padding-right" style={{ height: '100%' }}>
                        <div className="wrapper">
                        
                        <button 
                                                style={{ 
                                                    width: '128px', 
                                                    marginTop: '0px',
                                                    height: '48px', 
                                                    width: '100%',
                                                    backgroundColor: 'blueviolet',  
                                                    color: 'white',
                                                    fontSize: '18', 
                                                    float: 'right', 
                                                    marginRight: '0px',
                                                    borderRadius: '0px'
                                                }}
                                                onClick={this.handleClick}
                                            >
                                               <img alt = "app_icon" width = "50" src="add_friend.png"/> Add group
                                                {                                  
                                                    this.state.isShowingModal &&
                                                    <ModalContainer onClose={this.handleClose}>
                                                        <ModalDialog onClose={this.handleClose}>
                                                            <div className="login">
                                                                <h2 className="login-header">Add Group</h2>
                                                                <form className="login-container">
                                                                    <p><input type="text" placeholder="Username" value={this.state.newGroupName} onChange={this.handleCreateGroup}/></p>
                                                                    <p><input type="submit" value="OK" onClick={this.createGroup} /></p>
                                                                </form>
                                                            </div>
                                                        </ModalDialog>
                                                    </ModalContainer>
                                                }
                                            </button>
                            <div className="myInner" id="inner" style={{ display: 'flex', flexDirection: 'column' }} >
                                <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', width: '100%', padding: 8 }} >JOINED GROUPS</div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', display: 'block', overflow: 'scroll' }}>
                                {
                                    this.state.joinedGroups.map((group) => {
                                        return (<GroupRow 
                                                    name={group.name}
                                                    gid={group._id} 
                                                    groupNumber={this.state.unread[group._id]} 
                                                    isSelected={this.state.selectedGroupID == group._id}
                                                    lastMessage={this.state.lastMessage[group._id] || '...'} 
                                                    onClick={() => this.selectGroup(group._id)}
                                                />);
                                    })    
                                }
                                </div>
                                <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', width: '100%', padding: 8 }} >ALL GROUPS</div>
                                < div style = {
                                    {
                                        height: '50%',
                                        display: 'block',
                                        overflow: 'scroll',
                                        flex: 1, 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                    }
                                } >
                                {
                                    this.state.groupList.map((group) => {
                                        return (<GroupRow 
                                                    name={group.name}
                                                    gid={group._id} 
                                                    groupNumber={this.state.unread[group._id]} 
                                                    isSelected={false}
                                                    lastMessage={this.state.lastMessage[group._id] || '...'} 
                                                    onClick={() => this.selectGroup(group._id)}
                                                />);
                                    })    
                                }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-9 no-padding-left" style={{ height: '100%' }}>
                        <div className="wrapper">
                            <nav className="nav" id="nav">
                                <div className="default-nav">
                                    <div className="main-nav">
                                        <div className="main-nav-item"><a className="main-nav-item-link" href="#">{this.state.selectGroupName}</a></div>
                                        <div className="options">
                                        <button 
                        style={{ 
                            width: '128px', 
                            marginTop: '0px',
                            height: '30px', 
                            backgroundColor: 'red', 
                            borderColor: '#28d', 
                            color: 'white',
                            fontSize: 18, 
                            float: 'right', 
                            marginRight: '48px',
                            borderRadius: '0px'
                        }}
                        onClick={this.onLogOutClick}
                    >
                         <img alt = "app_icon" width = "20" src="logout.png"/> Log out
                    </button>
                                        {
                                            this.state.selectedGroupID != '' &&
                                            <button 
                                                style={{ 
                                                    backgroundColor: 'gray', 
                                                    marginTop: '30px',
                                                    width: '128px', 
                                                    height: '32px', 
                                                    border: '0px solid',
                                                    borderRadius: '16px'
                                                }}
                                                onClick={() => this.leaveGroup(this.state.selectedGroupID)}
                                            >
                                                Leave group
                                                {                                  
                                                    this.state.isShowingModal &&
                                                    <ModalContainer onClose={this.handleClose}>
                                                        <ModalDialog onClose={this.handleClose}>
                                                            <div className="login">
                                                                <h2 className="login-header">Leave Group</h2>
                                                                <form className="login-container">
                                                                    <p><input type="text" placeholder="Username" value={this.state.newGroupName} onChange={this.handleCreateGroup}/></p>
                                                                    <p><input type="submit" value="OK" onClick={this.createGroup} /></p>
                                                                </form>
                                                            </div>
                                                        </ModalDialog>
                                                    </ModalContainer>
                                                }
                                            </button>
                                        }
                                        </div>
                                    </div>
                                </div>
                            </nav>
                            {
                            this.state.selectedGroupID === '' ?
                                <div style={{ width: '100%', height: '530px', paddingTop: '10vh' }}>
                                </div>
                                :
                                <div>
                                    <div className="inner" id="inner">
                                        {
                                            
                                            this.state.messages.map((message, index) => {
                                                if (this.state.selectedGroupID === message.gid) {
                                                    return (
                                                        <Message name = {message.user.username} sentAt={message.send_at} id={index} key={message._id} user={message.user} message={message.content} isMe={message.uid === cookies.get('uid')} />
                                                    );
                                                }   
                                            })
                                        }


                                <div style={{height: '30px'}} id='#tracker' ref="trackerRef"></div>
                                    </div>
                                    
                                    <div className="bottom" id="bottom">
                                        <input className="input" id="input" value={this.state.text} onChange={this.handleChange} onKeyDown={(e) => { e.keyCode == 13 && this.sendText() }} />
                                        <div className="send" id="send" onClick={this.sendText}>
                                            <div style={{ width: '100%',height: '100%',paddingTop: '4px' }}>
                                                <div 
                                                    style={{ 
                                                        width: '32px',
                                                        height: '32px', 
                                                        top: 0, 
                                                        bottom: 0,
                                                        right: 0, 
                                                        left: 0,
                                                        margin: 'auto',  
                                                    }}
                                                >
                                                    <img 
                                                        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/104946/ic_send_white_48dp.png" 
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '100%' 
                                                        }} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </div>
                            }
                        </div>
                    </div>
                </div>
                
                

            </div>
            
        );
    }
}

export default Main;
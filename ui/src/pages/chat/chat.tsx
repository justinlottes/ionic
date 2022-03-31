import './chat.scss';
import { Link, NavLink, Route, RouteProps, Routes } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { stringToColor } from '../../utils';
import { Chatroom, ChatroomCard, NewChatroom } from '../../components';
import { models } from '../../models';
import { APIService } from '../../services';
import { useNavigate } from 'react-router-dom';

export interface ChatProps { }

export const ChatPage: React.FunctionComponent<ChatProps> = () => {

		const navigate = useNavigate();
		const [currentUser, setCurrentUser] = useState(undefined as (models.User | undefined));
    const [chatrooms, setChatrooms] = useState([] as models.Chatroom[]);

		const getCurrentUser = async() => {
			return APIService.getCurrentUser().then(user => {
				if(user) {
					setCurrentUser(user)
				} else {
					navigate('/login');
				}
			});
		};

		const getChatrooms = async() => {
			return APIService.getRooms(true).then(rooms => {
				console.log(JSON.stringify(rooms));
				setChatrooms(rooms);
			}).catch(() => {
				console.log('not logged in?');
			});
		}

		useEffect(() => {
			getCurrentUser();
		}, []);
		
		useEffect(() => {
			if(currentUser) {
				getChatrooms();
			}
		}, [currentUser]);

    const logout = async () => {
				await APIService.logout()
				navigate('/login');
        return;
    };

    const sortChatrooms = (_1: object, _2: object) => {
        return 0;
    };

    return (
        <div id='container'>
            <div className='chatroom'>
                <aside className='chatroom__sidebar'>
                    <section className='sidebar__header'>
                        <div className='identifiers'>
                            <h1>the chat site</h1>
                            <h2>
                                chatting as <span className='name' style={{ color: stringToColor(currentUser?.name) }}>{currentUser?.name}</span>
                            </h2>
                        </div>
                        <div className='actions'>
                            <button onClick={() => logout()}>logout</button>
                        </div>
                    </section>
                    <ul className='sidebar__list'>
                        <div className='new-room-option'>
                            <Link to={'new'}>create new room</Link>
                        </div>
                        {chatrooms
                            ?.slice()
                            ?.sort((c1, c2) => sortChatrooms(c1, c2))
                            ?.map(c => (
                                <li key={c.id}>
                                    <NavLink
                                        className={isActive => isActive ? 'is-active' : ''}
                                        to={`${c.id}`}>
                                        <ChatroomCard mostRecentMessage={c.mostRecentMessage} name={c.name} />
                                    </NavLink>
                                </li>
                            ))}
                    </ul>
                </aside>
                <main className='chatroom__window'>
                    <Routes>
                        <Route path='' element={
                            <div className='no-chatroom'>
                                <h3>Join a chatroom...</h3>
                            </div>
                        }>
                        </Route>
                        <Route path='new' element={<NewChatroom/>}>
                        </Route>
                        <Route path=':id' element={<Chatroom/>} />
                    </Routes>
                </main>
            </div>
        </div >
    );
};

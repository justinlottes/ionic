import './chatroom.scss';
import React, { useEffect, useState } from 'react';
import { ChatBubble } from '../chat-bubble/chat-bubble';
import { models } from '../../models';
import { useParams } from 'react-router-dom';
import { APIService } from '../../services';

export interface ChatroomProps { }

type RouteParams = {
    id: string;
}

export const Chatroom: React.FunctionComponent<ChatroomProps> = () => {

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([] as models.Message[]);
    const [currentUser, setCurrentUser] = useState(undefined as models.User | undefined);
    const { id } = useParams<RouteParams>();

    let sendingMessage = false;
    let loadingMessages = false;

		//TODO - copy pasta
		const getCurrentUser = async() => {
			return APIService.getCurrentUser().then(user => {
				if(user) {
					setCurrentUser(user)
				}
			});
		};

		const getMessages = async() => {
			console.log('id param', id);
			return APIService.getMessages(parseInt(id as string)).then((messages) => {
				console.log(messages);
				setMessages(messages);
			}).catch((err: any) => {
				console.log('fetch err: ', err);
			});
		};

    const sendMessage = async () => {
        if (sendingMessage) {
            return;
        }

				sendingMessage = true;

				return APIService.createMessage(parseInt(id as string), message).then(getMessages);
    };

		useEffect(() => {
			getCurrentUser();
		}, [id]);

    useEffect(() => {
				if(currentUser) {
					getMessages();
				}
    }, [id, currentUser]);

    return (
        <section className='chat'>
            <main className='chat__view'>
                {(messages || [])?.map((m, i) => {
                    const isContinued = (i + 1 < messages!.length) && messages![i + 1].sentBy.id === m.sentBy.id;
                    const isCurrentUser = m.sentBy.id === currentUser?.id;
                    return <ChatBubble key={m.id} name={m.sentBy.name} sentByUser={isCurrentUser} appearContinued={isContinued} content={m.content} />
                })}
            </main>
            <footer className='chat__input'>
                <textarea disabled={sendingMessage} value={message} onChange={(e) => setMessage(e.target.value)} />
                <button disabled={sendingMessage} onClick={() => sendMessage()}> Send </button>
            </footer>
        </section>
    )
};

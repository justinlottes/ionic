import React, { useState } from 'react';
import './new-chatroom.scss';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../../services/api.service';

export interface NewChatroomProps {
}

export const NewChatroom: React.FunctionComponent<NewChatroomProps> = () => {
    const [name, setName] = useState('');
    let creatingRoom = false;
		const navigate = useNavigate();

    // need to be able to create room
    const create = async () => {
        if (creatingRoom) {
            return;
        }

				creatingRoom = true;

				APIService.createRoom(name).then((id: number) => {
					navigate(`/chat/${id}`);
				}).catch((err: any) => {
					console.error('creatRoomErr', err);
				}).finally(() => {
					creatingRoom = false;
				});
    };

    return (
        <div className='new-chatroom'>
            <div className='card'>
                <h2>Choose a name for the new room</h2>
                <label>
                    Room name
                    <input disabled={creatingRoom} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <button disabled={creatingRoom} onClick={() => create()}>
                    Create Room
                </button>
            </div>
        </div>
    );
};

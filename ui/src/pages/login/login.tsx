import './login.scss';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { APIService } from '../../services';
import { useNavigate } from 'react-router-dom';

export interface LoginProps { }

export const LoginPage: React.FunctionComponent<LoginProps> = () => {
    let loggingIn = false;
    const [username, setUsername] = useState('');
		const navigate = useNavigate();

    // need to be able to login
    const login = async () => {
        if (loggingIn) {
            return;
        }

				try {
					loggingIn = true;

					await APIService.login(username);

					navigate('/chat');
				} catch(ex: any) {
					loggingIn = false;
				}
    }

    return (
        <div id='container'>
            <div className='login'>
                <div className='welcome-card'>
                    <h1>
                        welcome to <span className='app-name'>the chat site</span>
                    </h1>
                    <h2>Please login or <Link to='/signup'>sign up</Link></h2>
                    <label>
                        Username
                        <input type='text' value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
                    </label>
                    <button type='submit' onClick={() => login()}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

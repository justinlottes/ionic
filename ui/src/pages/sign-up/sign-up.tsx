import './sign-up.scss';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { APIService } from '../../services';
import { useNavigate } from 'react-router-dom';

interface SignUpProps {
}

export const SignUpPage: React.FunctionComponent<SignUpProps> = () => {
    
    // need to be able to create user
    let creatingUser = false;
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
		const navigate = useNavigate();

    const signUp = async () => {
        if (creatingUser) {
            return;
        }

				try {
					creatingUser = true;

					await APIService.createUser({name, username});

					navigate('/login');
				} catch (ex: any) {
					creatingUser = false;
				}
    };

    return (
        <div id='container'>
            <div className='sign-up'>
                <div className='welcome-card'>
                    <h1>
                        welcome to <span className='app-name'>the chat site</span>
                    </h1>
                    <h2>Create your account or <Link to='/login'>back to login</Link></h2>
                    <label>
                        Username
                        <input type='text' value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
                    </label>
                    <label>
                        Name
                        <input type='text' value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <button onClick={() => signUp()} type='submit' >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

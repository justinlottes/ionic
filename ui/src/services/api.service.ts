import { models } from '../models';//TODO - move to auth service


export interface APIErrorResponse {
    code: number; 
    message: string;
}

const API_URL: string = process.env.CHAT_API_ENDPOINT || 'http://localhost:5000';

export class APIService {

		//TODO - move to auth service
		static credentials: models.User | undefined = undefined;
		static async getCurrentUser() {
			//Use an observable instead, ReplaySubject(1)
			console.log('credentials', JSON.stringify(APIService.credentials));

			return APIService.credentials;
		}

    static isJson(res: Response): boolean {
        return !!res.headers.get('content-type')?.includes('application/json');
    }

    static async do(route: RequestInfo, options: RequestInit) {
        const res = await fetch(route, options);
        await APIService.throwIfError(res);
        if (APIService.isJson(res)) {
            return await res.json();
        }
        return await res.text();
    }

    static async throwIfError(res: Response) : Promise<void> {
        if (res.ok) {
            return;
        }
        if (APIService.isJson(res)) {
            throw await res.json();
        }
        const error: APIErrorResponse = { code: res.status, message: res.statusText };
        throw error;
    }

    static async ping(): Promise<string> {
        return APIService.do(`${API_URL}/ping`, {
            method: 'GET',
        });
    }

		static async createUser(userInfo: {name: string, username: string}): Promise<void> {
			try {
				await APIService.do(`${API_URL}/registration/register`, {
					method: 'POST',
					headers: [['Content-Type', 'application/json']],
					body: JSON.stringify(userInfo),
				});

				return Promise.resolve();
			} catch(ex: any) {
				return Promise.reject();
			}
		}

		static async login(username: string): Promise<void> {
			try {
				const userInfo = await APIService.do(`${API_URL}/auth/login`, {
					method: 'POST',
					headers: [['Content-Type', 'application/json']],
					body: JSON.stringify({
						username,
					}),
				});

				APIService.credentials = userInfo;

				return Promise.resolve();
			} catch(ex: any) {
				APIService.credentials = undefined;
				return Promise.reject();
			}
		}

		static async logout(): Promise<void> {
			APIService.credentials = undefined;
			return Promise.resolve();
		}

		static async createRoom(room: string): Promise<number> {
			if(!APIService.credentials) {
				return Promise.reject();//TODO - navigate to login
			}

			try {
				const result = await APIService.do(`${API_URL}/room`, {
					method: 'POST',
					headers: [
						['Content-Type', 'application/json'],
						['Fake-Authorization', APIService.credentials.username]
					],
					body: JSON.stringify({
						name: room,
					})
				});

				return result.id;
			} catch(ex: any) {
				console.log('createRoomErr', ex);
				return Promise.reject();
			}
		}

		static async getUsers(userIds: number[]): Promise<models.User[]> {
			if(!APIService.credentials) {
				return Promise.reject();//TODO - navigate to login
			}

			//TODO escape User Ids
			if(userIds.length > 0) {
				return (await APIService.do(`${API_URL}/user?userIds=${userIds.join(',')}`, {
					method: 'GET',
					headers: [
						['Fake-Authorization', APIService.credentials.username]
					],
				})).users;
			}
			
			return Promise.resolve([] as models.User[]);
		}
		
		static async buildMessages(messages: any[]): Promise<models.Message[]> {
			const userIds: number[] = Array.from(messages.reduce((set: Set<number>, msg: any) => {
				set.add(msg.userId);
				return set;
			}, new Set<number>()));

			const users = new Map<number, models.User>();
			if(userIds.length > 0) {
				(await APIService.getUsers(userIds)).forEach((user: models.User) => {
					users.set(user.id, user);
				});
			}

			return messages.map(msg => ({
				id: msg.id,
				roomId: msg.roomId,
				sentBy: users.get(msg.userId) as models.User,
				sentAt: new Date(msg.createdAt),
				content: msg.message,
			}));
		}

		static async getRooms(withLatest: boolean = false): Promise<models.Chatroom[]> {
			if(!APIService.credentials) {
				return Promise.reject();//TODO - navigate to login
			}

			try {
				const latestMsgs = new Map<number, models.Message>();

				if(withLatest) {

					//MAKE EXTERNAL METHOD
					const messagesRaw = await APIService.buildMessages((await APIService.do(`${API_URL}/message`, {
						method: 'GET',
						headers: [
							['Fake-Authorization', APIService.credentials.username]
						],
					})).messages);
					
					messagesRaw.forEach((msg: models.Message) => {
						latestMsgs.set(msg.roomId, msg);
					});
				}

				return (await APIService.do(`${API_URL}/room`, {
					method: 'GET',
					headers: [
						['Fake-Authorization', APIService?.credentials?.username as unknown as string]
					],
				})).rooms.map((room: any) => ({
					id: room.id,
					name: room.name,
					mostRecentMessage: latestMsgs.get(room.id) ?? null,
				}));
			} catch(ex: any) {
				console.log('getRoomErr', ex);
				return Promise.reject();
			}
		}

		static async createMessage(roomId: number, message: string): Promise<void> {
			if(!APIService.credentials) {
				return Promise.reject();//TODO - navigate to login
			}

			try {
				await APIService.do(`${API_URL}/room/${roomId}/message`, {
					method: 'POST',
					headers: [
						['Content-Type', 'application/json'],
						['Fake-Authorization', APIService.credentials.username]
					],
					body: JSON.stringify({
						message
					})
				});
			} catch(ex: any) {
				console.log('createMessageErr', ex);
				return Promise.reject();
			}
		}

		static async getMessages(room: number): Promise<models.Message[]> {
			if(!APIService.credentials) {
				return Promise.reject();
			}

			try {
				return APIService.buildMessages((await APIService.do(`${API_URL}/room/${room}/message`, {
					method: 'GET',
					headers: [
						['Fake-Authorization', APIService.credentials.username]
					],
				})).messages);
			} catch(ex: any) {
				console.log('createMessageErr', ex);
				return Promise.reject();
			}
		}
}

// feel free to change all schemas

export interface User {
    id: number;
    name: string;
		username: string;
}

export interface Message {
    id: number;
		roomId: number;
    sentBy: User;
    sentAt: Date;
    content: string;
}

export interface Chatroom {
    id: number
    mostRecentMessage: Message;
    name: string;
}

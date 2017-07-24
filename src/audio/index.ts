import config from 'assets/config';

import {Manager} from './Manager';


export const context = new AudioContext();
export const manager = new Manager(new AudioContext(), config.audio);

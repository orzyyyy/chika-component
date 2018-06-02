/*
 * @Author: zy9@github.com/zy410419243 
 * @Date: 2018-05-28 15:20:13 
 * @Last Modified by: zy9
 * @Last Modified time: 2018-06-02 20:39:53
 */
import React from 'react'
import ReactDOM from 'react-dom'

import { Route, NavLink, HashRouter } from 'react-router-dom'

import RedBox from 'redbox-react'

import Bundle from './util/Bundle'

const Calendar = props => (
    <Bundle load={ () => import('./modules/Calendar_demo/Calendar_demo') }>
        { Calendar => <Calendar {...props}/> }
    </Bundle>
)

const Button = props => (
    <Bundle load={ () => import('./modules/Button_demo/Button_demo') }>
        { Button => <Button {...props}/> }
    </Bundle>
)

const MOUNT_NODE = document.getElementById('root');

try {
    ReactDOM.render(
        <HashRouter>
            <div>
                <Route path='/button' component={ Button } />
                <Route path='/calendar' component={ Calendar } />
            </div>
        </HashRouter>
    , MOUNT_NODE);
} catch (e) {
    ReactDOM.render(<RedBox error={e} />, MOUNT_NODE);
}
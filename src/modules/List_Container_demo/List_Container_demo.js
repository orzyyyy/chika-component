/*
 * @Author: zy9@github.com/zy410419243 
 * @Date: 2018-06-02 21:02:58 
 * @Last Modified by: zy9
 * @Last Modified time: 2018-07-06 17:05:43
 */
import React from 'react'

// import Container from '../../component/List_Container'
import Container from '../../../dist/List_Container'
import './css/List_Container_demo.css'

export default class List_Container_demo extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    handle_onChange = item => {
        console.log(item)
    }

    config = {
        tcid: 10874,
        menuid: 1428,
        // pageSize: 5,
        // hasSearch: false, // 是否显示搜索面板
        hasAdd: false, // 是否显示右下添加按钮
        // UserId: 1,
        // CellPhone: 13900000000,
        // RequestUrl: '../../webapi/api/v2/generalbackstage/getdata',
        RequestParams: {
            // TCID: 1620,
            // PageSize: 10,
            // PageIndex: 1,
            // CellPhone: 13900000000,
            // sectionid: 4,
            // AddSearchField: 1,
        },
        // RequestMethod: 'POST',
    }

    render() {
        return (
            <div className='List_Container_demo'>
                <Container config={this.config} debug style={{ height: (document.documentElement.clientHeight || document.body.clientHeight) - 10 }}>
                    <div className='container' bind='true'>
                        <ul>
                            <li>
                                <div className='left'>
                                    <label>名称：</label>
                                    <label data-key='pjnm'></label>
                                </div>
                                <div className='right'>
                                    <label>坝高：</label>
                                    <label data-key='dam_width' unit='m' decimalcount={2}></label>
                                </div>
                            </li>

                            <li>
                                <div className='left'>
                                    <label>坝长：</label>
                                    <label data-key='crest_length'></label>
                                </div>
                                <div className='right'>
                                    <label>主坝类型：</label>
                                    <label data-key='retain_dam_type'></label>
                                </div>
                            </li>
                        </ul>
                    </div>
                </Container>
            </div>
        )
    }
}
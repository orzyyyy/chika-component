import React, { Component } from 'react';
import { Upload } from '../../component/Upload';
import { ajax } from '../../util/urlHelper';

interface UploadFile extends File {
  id: string;
  url: string;
}

export default class UploadDemo extends Component {
  state: { fileList: Array<UploadFile>; loading: boolean } = {
    fileList: [],
    loading: false,
  };

  componentDidMount = () => {
    ajax({
      url: '../../mock/uploadFiles.json',
      success: ({ data }) => {
        let fileList: any = [];
        for (let item of data) {
          fileList.push({
            url: item.filepath,
            id: item.id,
          });
        }
        this.setState({ fileList });
      },
    });
  };

  onChange = (file: UploadFile) => {
    const { fileList } = this.state;
    fileList.push(file);
    this.setState({ fileList });
  };

  handlePress = (file: UploadFile) => {
    const { fileList } = this.state;
    const index = fileList.findIndex(f => f.id === file.id);
    fileList.splice(index, 1);
    this.setState({ fileList });
  };

  render = () => {
    const { fileList } = this.state;
    return (
      <Upload
        fileList={fileList}
        onChange={this.onChange}
        style={{ padding: 6 }}
        onClick={this.handlePress}
      />
    );
  };
}

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

const getGroups = childProps => {
  let result = [];
  for (let item of childProps) {
    result.push(item.group);
  }
  result = Array.from(new Set(result));
  return result;
};

// generate state by group names
const generateNewState = (groups, childProps) => {
  let newState = {};

  for (let groupName of groups) {
    newState[groupName] = [];
    for (let childProp of childProps) {
      if (groupName === childProp.group) {
        newState[groupName].push(childProp);
      }
    }
  }
  return newState;
};

export default class TransformManager extends PureComponent {
  static propTypes = {
    currentGroup: PropTypes.string,
    currentOrder: PropTypes.number,
  };

  static defaultProps = {
    currentGroup: '',
    currentOrder: 0,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    let childProps = [];
    React.Children.map(nextProps.children, child => {
      childProps.push(Object.assign({}, child.props, { key: child.key }));
    });
    const groups = getGroups(childProps);
    return generateNewState(groups, childProps);
  }

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount = () => {};

  renderChildren = () => {
    if (Object.keys(this.state).length === 0) {
      return null;
    }
    const { currentGroup, currentOrder } = this.props;
    let result = [];
    const current = this.state[currentGroup];
    const currentLen = current.length;
    for (let i = 0; i < currentLen; i++) {
      const { children, ...props } = current[i];
      if (i === currentOrder) {
        result.push(
          React.createElement(
            'div',
            Object.assign({}, props, { style: { color: 'pink' } }),
            children,
          ),
        );
        continue;
      }
      result.push(React.createElement('div', props, children));
    }
    return result;
  };

  render = () => {
    return <div className="TransformManager">{this.renderChildren()}</div>;
  };
}

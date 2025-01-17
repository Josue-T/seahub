import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownMenu, DropdownToggle, DropdownItem } from 'reactstrap';
import { gettext, enableFileTags } from '../../utils/constants';
import { Utils } from '../../utils/utils';
import TextTranslation from '../../utils/text-translation';
import SeahubPopover from '../common/seahub-popover';
import ListTagPopover from '../popover/list-tag-popover';
import ViewModes from '../../components/view-modes';
import ReposSortMenu from '../../components/repos-sort-menu';
import MetadataViewToolBar from '../../metadata/components/view-toolbar';
import { PRIVATE_FILE_TYPE } from '../../constants';
import { DIRENT_DETAIL_MODE } from '../dir-view-mode/constants';
import { FACE_RECOGNITION_VIEW_ID } from '../../metadata/constants';

const propTypes = {
  repoID: PropTypes.string.isRequired,
  userPerm: PropTypes.string,
  currentPath: PropTypes.string.isRequired,
  updateUsedRepoTags: PropTypes.func.isRequired,
  onDeleteRepoTag: PropTypes.func.isRequired,
  currentMode: PropTypes.string.isRequired,
  switchViewMode: PropTypes.func.isRequired,
  isCustomPermission: PropTypes.bool,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.string,
  sortItems: PropTypes.func,
  viewId: PropTypes.string,
};

class DirTool extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isRepoTagDialogOpen: false,
      isDropdownMenuOpen: false,
    };

    this.sortOptions = [
      { value: 'name-asc', text: gettext('By name ascending') },
      { value: 'name-desc', text: gettext('By name descending') },
      { value: 'time-asc', text: gettext('By time ascending') },
      { value: 'time-desc', text: gettext('By time descending') }
    ];
  }

  toggleDropdownMenu = () => {
    this.setState({
      isDropdownMenuOpen: !this.state.isDropdownMenuOpen
    });
  };

  hidePopover = (e) => {
    if (e) {
      let dom = e.target;
      while (dom) {
        if (typeof dom.className === 'string' && dom.className.includes('tag-color-popover')) return;
        dom = dom.parentNode;
      }
    }
    this.setState({ isRepoTagDialogOpen: false });
  };

  toggleCancel = () => {
    this.setState({ isRepoTagDialogOpen: false });
  };

  getMenu = () => {
    const list = [];
    const { userPerm, currentPath } = this.props;
    if (userPerm !== 'rw' || Utils.isMarkdownFile(currentPath)) {
      return list;
    }
    const { TAGS } = TextTranslation;
    if (enableFileTags) {
      list.push(TAGS);
    }
    return list;
  };

  onMenuItemClick = (item) => {
    const { key } = item;
    switch (key) {
      case 'Tags':
        this.setState({ isRepoTagDialogOpen: !this.state.isRepoTagDialogOpen });
        break;
    }
  };

  onMenuItemKeyDown = (e, item) => {
    if (e.key == 'Enter' || e.key == 'Space') {
      this.onMenuItemClick(item);
    }
  };

  onSelectSortOption = (item) => {
    const [sortBy, sortOrder] = item.value.split('-');
    this.props.sortItems(sortBy, sortOrder);
  };

  showDirentDetail = () => {
    this.props.switchViewMode(DIRENT_DETAIL_MODE);
  };

  render() {
    const menuItems = this.getMenu();
    const { isDropdownMenuOpen } = this.state;
    const { repoID, currentMode, currentPath, sortBy, sortOrder, viewId, isCustomPermission } = this.props;
    const propertiesText = TextTranslation.PROPERTIES.value;
    const isFileExtended = currentPath.startsWith('/' + PRIVATE_FILE_TYPE.FILE_EXTENDED_PROPERTIES + '/');

    const sortOptions = this.sortOptions.map(item => {
      return {
        ...item,
        isSelected: item.value === `${sortBy}-${sortOrder}`
      };
    });

    if (isFileExtended) {
      if (viewId === FACE_RECOGNITION_VIEW_ID) return null;
      return (
        <div className="dir-tool">
          <MetadataViewToolBar viewId={viewId} isCustomPermission={isCustomPermission} showDetail={this.showDirentDetail} />
        </div>
      );
    }

    return (
      <React.Fragment>
        <div className="dir-tool d-flex">
          <ViewModes currentViewMode={currentMode} switchViewMode={this.props.switchViewMode} />
          <ReposSortMenu sortOptions={sortOptions} onSelectSortOption={this.onSelectSortOption}/>
          {(!isCustomPermission) &&
            <div className="cur-view-path-btn" onClick={this.showDirentDetail}>
              <span className="sf3-font sf3-font-info" aria-label={propertiesText} title={propertiesText}></span>
            </div>
          }
          {menuItems.length > 0 &&
          <Dropdown isOpen={isDropdownMenuOpen} toggle={this.toggleDropdownMenu}>
            <DropdownToggle
              tag="i"
              id="cur-folder-more-op-toggle"
              className='cur-view-path-btn sf3-font-more sf3-font'
              data-toggle="dropdown"
              title={gettext('More operations')}
              aria-label={gettext('More operations')}
              aria-expanded={isDropdownMenuOpen}
            >
            </DropdownToggle>
            <DropdownMenu right={true}>
              {menuItems.map((menuItem, index) => {
                if (menuItem === 'Divider') {
                  return <DropdownItem key={index} divider />;
                } else {
                  return (
                    <DropdownItem
                      key={index}
                      onClick={this.onMenuItemClick.bind(this, menuItem)}
                      onKeyDown={this.onMenuItemKeyDown.bind(this, menuItem)}
                    >{menuItem.value}
                    </DropdownItem>
                  );
                }
              })}
            </DropdownMenu>
          </Dropdown>
          }
        </div>
        {this.state.isRepoTagDialogOpen &&
        <SeahubPopover
          popoverClassName="list-tag-popover"
          target="cur-folder-more-op-toggle"
          hideSeahubPopover={this.hidePopover}
          hideSeahubPopoverWithEsc={this.hidePopover}
          canHideSeahubPopover={true}
          boundariesElement={document.body}
          placement={'bottom-end'}
        >
          <ListTagPopover
            repoID={repoID}
            onListTagCancel={this.toggleCancel}
          />
        </SeahubPopover>
        }
      </React.Fragment>
    );
  }

}

DirTool.propTypes = propTypes;

export default DirTool;

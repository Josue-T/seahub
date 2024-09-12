import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import EmptyTip from '../../../../../components/empty-tip';
import { gettext } from '../../../utils';

const GalleryMain = ({ groups, overScan, columns, size, gap }) => {
  const imageHeight = useMemo(() => size + gap, [size, gap]);

  const renderDisplayGroup = useCallback((group) => {
    const { top: overScanTop, bottom: overScanBottom } = overScan;
    const { name, children, height, top } = group;

    // group not in rendering area, return empty div
    if (top >= overScanBottom || top + height <= overScanTop) {
      return (<div key={name} className="w-100" style={{ height, flexShrink: 0 }}></div>);
    }

    let childrenStartIndex = children.findIndex(r => r.top >= overScanTop);
    let childrenEndIndex = children.findIndex(r => r.top >= overScanBottom);

    // group in rendering area, but the image not need to render. eg: overScan: { top: 488, bottom: 1100 }, group: { top: 0, height: 521 },
    // in this time, part of an image is in the rendering area, don't render image
    if (childrenStartIndex === -1 && childrenEndIndex === -1) {
      return (<div key={name} className="w-100" style={{ height, flexShrink: 0 }}></div>);
    }

    childrenStartIndex = Math.max(childrenStartIndex, 0);
    if (childrenEndIndex === -1) {
      childrenEndIndex = children.length;
    }
    if (childrenEndIndex > 0) {
      childrenEndIndex = childrenEndIndex - 1;
    }

    return (
      <div key={name} className="metadata-gallery-date-group w-100" style={{ height }}>
        {childrenStartIndex === 0 && (<div className="metadata-gallery-date-tag">{name}</div>)}
        <div
          className="metadata-gallery-image-list"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            paddingTop: childrenStartIndex * imageHeight,
            paddingBottom: (children.length - 1 - childrenEndIndex) * imageHeight,
          }}
        >
          {children.slice(childrenStartIndex, childrenEndIndex + 1).map((row) => {
            return row.children.map(img => {
              return (
                <div key={img.src} tabIndex={1} className="metadata-gallery-image-item" style={{ width: size, height: size, background: '#f1f1f1' }}>
                  <img className="metadata-gallery-grid-image" src={img.src} alt={img.name} />
                </div>
              );
            });
          })}
        </div>
      </div>
    );
  }, [overScan, columns, size, imageHeight]);

  if (!Array.isArray(groups) || groups.length === 0) {
    return <EmptyTip text={gettext('No record')}/>;
  }

  return groups.map((group, index) => {
    return renderDisplayGroup(group, index);
  });
};

GalleryMain.propTypes = {
  groups: PropTypes.array,
  overScan: PropTypes.object,
  columns: PropTypes.number,
  size: PropTypes.number,
};

export default GalleryMain;

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { SfCalendar } from '@seafile/sf-metadata-ui-component';
import PropTypes from 'prop-types';
import { getDateDisplayString } from '../../../utils/cell';
import { DEFAULT_DATE_FORMAT } from '../../../constants';
import { gettext } from '../../../../utils/constants';

import './index.css';

const DateEditor = ({ value, field, onChange: onChangeAPI, lang }) => {
  const [showEditor, setShowEditor] = useState(false);
  const format = useMemo(() => field?.data?.format || DEFAULT_DATE_FORMAT, [field]);
  const newValue = useRef(value);

  const openEditor = useCallback(() => {
    setShowEditor(true);
  }, []);

  const onChange = useCallback((value) => {
    newValue.current = value;
  }, []);

  const onClear = useCallback(() => {
    onChangeAPI(null);
    setShowEditor(false);
  }, [onChangeAPI]);

  const closeEditor = useCallback(() => {
    setShowEditor(false);
    onChangeAPI(newValue.current);
  }, [onChangeAPI, newValue]);

  return (
    <>
      <div
        className="sf-metadata-property-detail-editor sf-metadata-date-property-detail-editor"
        placeholder={gettext('Empty')}
        onClick={openEditor}
      >
        {getDateDisplayString(value, format)}
      </div>
      {showEditor && (
        <SfCalendar lang={lang} format={format} value={value} onChange={onChange} onClose={closeEditor} onClear={onClear} />
      )}
    </>
  );
};

DateEditor.propTypes = {
  value: PropTypes.string,
  field: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  lang: PropTypes.string,
};

export default DateEditor;

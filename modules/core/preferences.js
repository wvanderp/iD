// https://github.com/openstreetmap/iD/issues/772
// http://mathiasbynens.be/notes/localstorage-pattern#comment-9
let _storage;
try { _storage = localStorage; } catch (e) { } // eslint-disable-line no-empty
_storage = _storage || (() => {
  const s = {};
  return {
    getItem: (k) => s[k],
    setItem: (k, v) => s[k] = v,
    removeItem: (k) => delete s[k],
  };
})();

const _listeners = {};

//
// corePreferences is an interface for persisting basic key-value strings
// within and between iD sessions on the same site.
//
/**
 * both gets and sets and removes a preference
 *
 * @param {string} k the key to get or set
 * @param {string} [v] if provided, the value to set. if null, the key will be removed
 * @returns {boolean} true if the action succeeded
 */
function corePreferences(k, v) {
  try {
    // set value if provided
    if (v === undefined) return _storage.getItem(k);
    // remove key if value is null
    if (v === null) _storage.removeItem(k);
    // set value otherwise
    else _storage.setItem(k, v);

    // trigger listeners
    if (_listeners[k]) {
      _listeners[k].forEach((handler) => handler(v));
    }

    return true;
  } catch (e) {
    if (typeof console !== 'undefined') {
      /* eslint-disable-next-line no-console */
      console.error('localStorage quota exceeded');
    }
    return false;
  }
}

// dedicated getter and setter
/**
 * gets a preference
 *
 * @param {string} k the key to get
 * @returns {string | undefined} the value of the key
 */
corePreferences.get = function (k) {
  return corePreferences(k);
};

/**
 * sets a preference
 *
 * @param {string} k the key to set
 * @param {string} v the value to set
 * @returns {boolean} true if the action succeeded
 * @see corePreferences
 */
corePreferences.set = function (k, v) {
  return corePreferences(k, v);
};

// adds an event listener which is triggered whenever
corePreferences.onChange = function (k, handler) {
  _listeners[k] = _listeners[k] || [];
  _listeners[k].push(handler);
};

export { corePreferences as prefs };

/**
 * Each key in the object is the name of a helper
 */
module.exports = {
  
  /**
   * Output the given piece of data to the console
   *
   * @example
   * {{ debug thingToOutput }}
   */
  debug: function(propertyToDebug, options) {
    console.log('==================== Debug start');
    console.log(propertyToDebug);
    console.log('==================== Debug end');
  },

	/**
	 * Get the string value of a JSON object, useful for debugging template data
	 *
	 * @param  {Object} obj JSON object
	 * @return {String}     Provided object as a string
	 *
	 * @example
	 * {{ json data }}
	 */
	json: function(obj) {
    return JSON.stringify(obj);
  }
}

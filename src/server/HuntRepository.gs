/**
 * Repository contract for hunt application data.
 *
 * Implementations must identify hunts by Hunt ID,
 * never by spreadsheet row number.
 */
class HuntRepository {
  /**
   * @param {string} applicant
   * @param {string} season
   * @returns {Object[]}
   */
  getApplicationQueue(applicant, season) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} huntId
   * @returns {Object|null}
   */
  getHunt(huntId) {
    throw new Error('Not implemented');
  }

  /**
   * @param {Object} command
   * @returns {Object}
   */
  updateApplicationStatus(command) {
    throw new Error('Not implemented');
  }

  /**
   * @param {Object} event
   * @returns {Object}
   */
  appendApplicationEvent(event) {
    throw new Error('Not implemented');
  }
}

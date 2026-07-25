class InMemoryHuntRepository extends HuntRepository {
  constructor(hunts = [], events = []) {
    super();
    this.hunts = hunts;
    this.events = events;
  }

  getApplicationQueue(applicant, season) {
    return this.hunts.filter((hunt) =>
      hunt.applicant === applicant &&
      hunt.season === season &&
      hunt.applyThisSeason === true &&
      hunt.applicationStatus === 'Not Started'
    );
  }

  getHunt(huntId) {
    return this.hunts.find((hunt) => hunt.huntId === huntId) || null;
  }

  updateApplicationStatus(command) {
    const hunt = this.getHunt(command.huntId);

    if (!hunt) {
      throw new Error(`Hunt not found: ${command.huntId}`);
    }

    hunt.applicationStatus = command.newStatus;
    hunt.lastUpdated = command.timestamp;
    hunt.updatedBy = command.updatedBy;

    if (command.newStatus === 'Applied') {
      hunt.dateApplied = command.timestamp;
    }

    return hunt;
  }

  appendApplicationEvent(event) {
    this.events.push(event);
    return event;
  }
}

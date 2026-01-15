import * as tenants from "./tenants";
import * as opportunities from "./opportunities";
import * as signups from "./signups";
import * as members from "./members";
import * as users from "./users";

export default {
	// Tenants
	getTenant: tenants.getTenant,
	getTenantById: tenants.getTenantById,
	listTenants: tenants.listTenants,
	createTenant: tenants.createTenant,
	updateTenant: tenants.updateTenant,
	deleteTenant: tenants.deleteTenant,

	// Opportunities
	getOpportunity: opportunities.getOpportunity,
	listOpportunities: opportunities.listOpportunities,
	createOpportunity: opportunities.createOpportunity,
	updateOpportunity: opportunities.updateOpportunity,
	publishOpportunity: opportunities.publishOpportunity,
	cancelOpportunity: opportunities.cancelOpportunity,
	deleteOpportunity: opportunities.deleteOpportunity,

	// Signups
	applyToOpportunity: signups.applyToOpportunity,
	updateSignup: signups.updateSignup,
	withdrawApplication: signups.withdrawApplication,
	listSignups: signups.listSignups,
	getSignup: signups.getSignup,
	getMySignups: signups.getMySignups,

	// Members
	getMember: members.getMember,
	listMembers: members.listMembers,
	inviteMember: members.inviteMember,
	updateMember: members.updateMember,
	removeMember: members.removeMember,
	getMyMemberships: members.getMyMemberships,
	joinTenant: members.joinTenant,

	// Users
	syncUser: users.syncUser,
	getUser: users.getUser,
	getUserById: users.getUserById,
	updateUser: users.updateUser,
};

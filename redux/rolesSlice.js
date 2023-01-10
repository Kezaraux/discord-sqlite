const { createSlice, createEntityAdapter } = require("@reduxjs/toolkit");

// {
//     ids: [...roleIds],
//     entities: {
//         roleId: {roleId, guildId},
//         roleId: {roleId, guildId},
//         ...
//     }
// }

const rolesAdapter = createEntityAdapter({
    selectId: roleObj => roleObj.roleId,
});
const rolesSelector = rolesAdapter.getSelectors(state => state.roles);

const rolesSlice = createSlice({
    name: "roles",
    initialState: rolesAdapter.getInitialState(),
    reducers: {
        roleAdded: rolesAdapter.addOne,
        roleRemoved: (state, action) => {
            rolesAdapter.removeOne(state, action.payload.roleId);
        },
    },
});

const { roleAdded, roleRemoved } = rolesSlice.actions;

module.exports = {
    rolesSelector,
    rolesSlice,
    roleAdded,
    roleRemoved,
};

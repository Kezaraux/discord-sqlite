const { createSlice, createEntityAdapter } = require("@reduxjs/toolkit");

// messageId: {
// channelId,
// guildId,
// 	title,
// 	size,
//  when,
//  timezone,
//  creatorID,
// 	members: {
// 		id: status
// 	}
// }

const groupsAdapter = createEntityAdapter();
const groupsSelector = groupsAdapter.getSelectors((state) => state.groups);

const groupsSlice = createSlice({
    name: "groups",
    initialState: groupsAdapter.getInitialState(),
    reducers: {
        groupAdded: (state, action) => {
            groupsAdapter.addOne(state, action.payload);
        },
        groupRemoved: (state, action) => {
            groupsAdapter.removeOne(state, action.payload.id);
        },
        groupMembersSet: (state, action) => {
            const { id, members } = action.payload;
            const group = state.entities[id];
            if (group) {
                group.members = members;
            }
        },
        groupMemberAdded: (state, action) => {
            const { id, member } = action.payload;
            const group = state.entities[id];
            if (group) {
                group.members[member.id] = member.status;
            }
        },
        groupMemberRemoved: (state, action) => {
            const { id, member } = action.payload;
            const group = state.entities[id];
            if (group) {
                const newGroup = Object.keys(group.members).reduce((acc, val) => {
                    if (val != member.id) {
                        acc[val] = group.members[val];
                    }
                    return acc;
                }, {});
                group.members = newGroup;
            }
        },
        groupSizeChanged: (state, action) => {
            const { id, size } = action.payload;
            const group = state.entities[id];
            if (group) {
                group.size = size;
            }
        },
        groupTitleChanged: (state, action) => {
            const { id, title } = action.payload;
            const group = state.entities[id];
            if (group) {
                group.title = title;
            }
        },
        groupDatetimeChanged: (state, action) => {
            const { id, datetime } = action.payload;
            const group = state.entities[id];
            if (group) {
                group.datetime = datetime;
            }
        },
        groupTimezoneChanged: (state, action) => {
            const { id, timezone } = action.payload;
            const group = state.entities[id];
            if (group) {
                group.timezone = timezone;
            }
        }
    }
});

const {
    groupAdded,
    groupRemoved,
    groupMemberAdded,
    groupMemberRemoved,
    groupMembersSet,
    groupSizeChanged,
    groupTitleChanged,
    groupTimezoneChanged,
    groupDatetimeChanged
} = groupsSlice.actions;

module.exports = {
    groupsSelector,
    groupsSlice,
    groupAdded,
    groupRemoved,
    groupMembersSet,
    groupMemberAdded,
    groupMemberRemoved,
    groupSizeChanged,
    groupTitleChanged,
    groupDatetimeChanged,
    groupTimezoneChanged
};

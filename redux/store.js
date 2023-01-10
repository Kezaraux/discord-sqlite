const { configureStore, getDefaultMiddleware } = require("@reduxjs/toolkit");

const { groupsSlice } = require("./groupsSlice");
const { rolesSlice } = require("./rolesSlice");

module.exports = configureStore({
    reducer: {
        groups: groupsSlice.reducer,
        roles: rolesSlice.reducer,
    },
    middleware: getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
    }),
    devTools: false,
});

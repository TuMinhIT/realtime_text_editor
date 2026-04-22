class AuthStore {
  handleLogout = async () => {
    try {
      await userService.logout();
    } finally {
      sessionService.clearCurrentUser();
      navigate(APP_ROUTES.login, { replace: true });
    }
  };
}
export default AuthStore;

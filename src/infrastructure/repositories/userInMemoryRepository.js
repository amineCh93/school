function createUserInMemoryRepository() {
  const usersByEmail = new Map();

  return {
    findByEmail(email) {
      return usersByEmail.get(email) || null;
    },
    save(user) {
      usersByEmail.set(user.email, user);
      return user;
    },
    nextId() {
      return usersByEmail.size + 1;
    }
  };
}

module.exports = {
  createUserInMemoryRepository
};

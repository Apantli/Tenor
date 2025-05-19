// Cleans cache, cookies and local storage.
describe('Session Initialization', () => {
    before(() => {      
      cy.clearLocalStorage();
      cy.clearCookies();
    });
    it('should clear local storage and cookies', () => {
      cy.window().then((win) => {
        expect(win.localStorage.length).to.equal(0);
      });
      cy.getCookies().should('be.empty');
    }
    );
});
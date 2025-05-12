describe('Setup', () => {
    it('should create shared project', () => {
      cy.signIn("/");
      cy.createEmptyProject();
      
      cy.url().then((url: string) => {
        cy.window().then((win: Window) => {
          win.localStorage.setItem('sharedProjectPath', url);
        });
      });
    });
});
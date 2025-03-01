describe('Chat App Flow', () => {
    it('should allow user to enter username and join chat', () => {
      cy.visit('http://localhost:3000');
      cy.get('input[placeholder="Enter your username"]').type('testuser');
      cy.get('button').contains('Login').click();
      cy.contains('UserName: testuser').should('be.visible');
    });
  
    it('should send and display a message', () => {
      cy.visit('http://localhost:3000');
      cy.get('input[placeholder="Enter your username"]').type('testuser');
      cy.get('button').contains('Login').click();
      cy.get('textarea').type('Hello, world!');
      cy.get('button').contains('Send').click();
      cy.contains('Hello, world!').should('be.visible');
    });
  });
describe('Chat App Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage(); 
  });

  it('should register and login a user', () => {
    const uniqueUsername = `user_${Date.now()}`;
    cy.visit('http://localhost:3000/register');
    cy.get('input[name="username"]').type(uniqueUsername);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="dob"]').type('1990-01-01');
    cy.get('select[name="gender"]').select('Male');
    cy.get('input[name="email"]').type(`${uniqueUsername}@example.com`);
    cy.get('button').contains('Register').click();

    cy.url().should('include', '/login');

    cy.get('input[placeholder="Username"]').type(uniqueUsername);
    cy.get('input[placeholder="Password"]').type('password123');
    cy.get('button').contains('Login').click();

    cy.get('textarea').should('be.visible');
  });

  it('should fail login with incorrect credentials', () => {
    cy.visit('http://localhost:3000/login');
    cy.get('input[placeholder="Username"]').type('nonexistent');
    cy.get('input[placeholder="Password"]').type('wrongpassword');
    cy.get('button').contains('Login').click();

    cy.on('window:alert', (str) => {
      expect(str).to.equal('Invalid credentials');
    });
  });

  it('should send a message after login', () => {
    const uniqueUsername = `user_${Date.now()}`;
    cy.visit('http://localhost:3000/register');
    cy.get('input[name="username"]').type(uniqueUsername);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="dob"]').type('1990-01-01');
    cy.get('select[name="gender"]').select('Male');
    cy.get('input[name="email"]').type(`${uniqueUsername}@example.com`);
    cy.get('button').contains('Register').click();

    cy.url().should('include', '/login');

    cy.get('input[placeholder="Username"]').type(uniqueUsername);
    cy.get('input[placeholder="Password"]').type('password123');
    cy.get('button').contains('Login').click();

    cy.get('textarea').type('Hello, world!');
    cy.get('button').contains('Send').click();
    cy.contains('Hello, world!').should('be.visible');
  });
});
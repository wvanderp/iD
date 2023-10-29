describe('main screen', () => {
  beforeEach(() => {
    cy.visit('/');
    // get the welcome message out of the way
    cy.get('.start-editing');
    cy.contains('Welcome to the iD OpenStreetMap editor');

    // start the walkthrough
    cy.get('.start-editing').click();

    cy.get('.help-control > button').click();

    cy.get('.walkthrough > a').click();
  });

  xit('should finish the welcome chapter', () => {
    // in this test we are going to do the entire walkthrough

    // step 1: welcome
    // welcome message
    cy.get('.button').click();
    // nothing will be saved
    cy.get('.button').click();
    // itallics
    cy.get('.button').click();
  });

  xit('should finish the Navigation chapter', () => {
    // step 2: Navigation
    // click on the navigation button
    cy.get('.chapter-navigation').click();

    // wait till the screen contains the text "Drag the map!"
    cy.contains('Drag the map!');

    // use the pan function to move the map because the mouse events are not working
    cy.window().then((win) => {
      win.eval('context.map().pan([100,100])');
    });

    // wait till the screen contains the text "Zoom the map!"
    cy.contains('Zoom the map!');

    // click on the zoom out button
    cy.get('.zoom-out').click();

    // click through the explanation
    // features
    cy.get('.button').click();
    // points lines and areas
    cy.get('.button').click();
    // nodes are called nodes
    cy.get('.button').click();


    cy.contains('Click the point to select it.');
    cy.get('.curtain-darkness');

    // step 3: Selecting
    cy.get('.touch > .points > .n2061').click({force: true});

    cy.contains('Great!');

    // pulsing
    cy.get('.button').click();
    //  feature editor
    cy.get('.button').click();
    // feature's type
    cy.get('.button').click();
    // fields
    cy.get('.button').click();

    // click on the close button
    cy.get('.close').click();

    // step 4: searching
    cy.get('.search-header > input').click();
    cy.get('.search-header > input').type('Spring Street', {delay: 100});

    // click on the first result
    cy.contains('Spring Street');
    cy.get('.feature-list > :nth-child(2) > .label').click();

    cy.contains('Great! Spring');
    cy.get('.button').click();

    cy.contains('Close the feature');
    cy.get('.close').click({force: true});

    // see the last step
    cy.contains('next chapter');
  });

  it('should finish the Points chapter', () => {
    cy.get('.chapter-point').click();

    // click on the point button
    cy.contains('Point button');
    cy.get('.add-point').click({force: true});

    // move the mouse to the building
    cy.contains('Move the mouse pointer over this building');

    // click inside the building
    // get the first w86 class and click on it
    cy.get('path.way.area.fill.w86.tag-building.tag-building-yes').click({force: true});

    // search for cafe
    cy.contains('Search for \'Cafe\'.');
    cy.get('.preset-search-input').click();
    cy.get('.preset-search-input').type('Cafe', {delay: 100});

    // select the first result
    cy.contains('Choose Cafe from the list.');
    cy.get('.preset-amenity-cafe > .preset-list-button-wrap > .preset-list-button > .label').click();

    // The point is now
    cy.contains('The point is now');
    cy.get('.button').click();

    // add a name
    cy.contains('Add a name for the cafe.');
    cy.get('div.form-field-input-wrap.form-field-input-localized > input').click();
    cy.get('div.form-field-input-wrap.form-field-input-localized > input').type('Test Cafe', {delay: 100});

    // click on the close button
    cy.contains('close the feature editor');
    cy.get('.close').click();

    // open the node again
    cy.contains('Select the cafe you just created.');
    cy.get('.n-1.target').click({force: true});

    // add a cuisine
    cy.contains('Change the cafe details.');
    cy.get('.form-field-cuisine > div > ul').click();

    cy.wait(1000);
  });
});

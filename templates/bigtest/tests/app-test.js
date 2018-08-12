import { expect } from 'chai';
import { beforeEach, describe, it } from '@bigtest/mocha';
import { setupApplicationForTesting } from '../helpers/setup-app';

import AppInteractor from '../interactors/app.js';

describe('TodoMVC BigTest example', () => {
  let TodoApp = new AppInteractor();

  beforeEach(async () => {
    await setupApplicationForTesting();
  });

  describe('update BigTest install progress', () => {
    beforeEach(async () => {
      let completed = new Array(6).fill(null);

      completed.forEach(async (item, index) => {
        await TodoApp.todoList(index).toggle();
      });

      await TodoApp.clickFilter('Active');
    });

    it('has four todos left', () => {
      expect(TodoApp.todoCount).to.equal(4);
    });

    it('has the active filter selected', () => {
      expect(TodoApp.activeFilter).to.equal('Active');
    });

    describe('adding the final todos with a typo', () => {
      beforeEach(async () => {
        await TodoApp.fillTodo('Fill in your interactor')
          .submitTodo()
          .fillTodo('rite tests')
          .submitTodo();
      });

      it('increases the todo count', () => {
        expect(TodoApp.todoCount).to.equal(6);
      });

      it('appends to the list', () => {
        expect(TodoApp.todoList(4).todoText).to.equal(
          'Fill in your interactor'
        );
        expect(TodoApp.todoList(5).todoText).to.equal('rite tests');
      });

      describe('fixing the typo', () => {
        beforeEach(async () => {
          await TodoApp.todoList(5)
            .only()
            .doubleClick()
            .fillInput('Write tests')
            .pressEnter();
        });

        it('properly edits the todo item', () => {
          expect(TodoApp.todoList(5).todoText).to.equal('Write tests');
        });

        describe('viewing all Todos', () => {
          beforeEach(async () => {
            await TodoApp.clickFilter('All');
          });

          it('selects the right filter', () => {
            expect(TodoApp.activeFilter).to.equal('All');
          });

          it('has the correct number of todos', () => {
            expect(TodoApp.todoCount).to.equal(12);
            expect(TodoApp.completedCount).to.equal(6);
          });
        });
      });
    });
  });
});

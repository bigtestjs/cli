import { expect } from 'chai';
import { beforeEach, describe, it } from '@bigtest/mocha';
import { setupApplicationForTesting } from '../helpers/setup-app';
import { when } from '@bigtest/convergence';

import AppInteractor from '../interactors/app.js';

describe('TodoMVC BigTest example', () => {
  let TodoApp = new AppInteractor();

  beforeEach(async () => {
    await setupApplicationForTesting();
  });

  it('has ten todos to start with', () => {
    expect(TodoApp.todoCount).to.equal(10);
  });

  describe('update BigTest install progress', () => {
    beforeEach(async () => {
      let completed = new Array(6).fill(null);

      for (let index in completed) {
        await TodoApp.todoList(parseInt(index, 10)).toggle();
      }

      await TodoApp.clickActiveFilter();
    });

    it('has four todos left', () => {
      expect(TodoApp.todoCount).to.equal(4);
    });

    it('has the active filter selected', () => {
      expect(TodoApp.activeFilter).to.equal('Active');
    });

    describe('adding the final todos with a typo', () => {
      beforeEach(async () => {
        await TodoApp.fillTodo('Fill in your interactor').submitTodo();
        // Interactors are _super_ fast. Users can't add two todos in
        // 20ms, so lets try to act like a user here and wait for a
        // todo to be added before adding the next
        await when(() => TodoApp.todoList().length === 5);
        await TodoApp.fillTodo('rite tests').submitTodo();
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
            .doubleClick()
            .todoList(5)
            .fillInput('Write tests')
            .todoList(5)
            .pressEnter();
        });

        it('properly edits the todo item', () => {
          expect(TodoApp.todoList(5).todoText).to.equal('Write tests');
        });

        describe('viewing all Todos', () => {
          beforeEach(async () => {
            await TodoApp.clickAllFilter();
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

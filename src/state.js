/**
 * Battle state. Pure object, mutated via methods.
 * BattleScene calls these on user input; ResultScene reads result().
 */
export function createBattle({ questions }) {
  const total = questions.length;
  return {
    questions,
    hearts: 3,
    index: 0,
    choices: [],
    elapsed: 0,

    answer(choice, correct, secondsForThisQuestion) {
      this.choices.push(choice);
      this.elapsed += Number(secondsForThisQuestion) || 0;
      if (!correct) this.hearts = Math.max(0, this.hearts - 1);
      this.index++;
    },

    current() { return this.questions[this.index]; },

    done() { return this.index >= total || this.hearts <= 0; },

    result() {
      const allAnswered = this.choices.length === total;
      const win = allAnswered && this.hearts > 0;
      return {
        win,
        hearts_left: this.hearts,
        choices: this.choices.slice(),
        time_sec: Math.round(this.elapsed),
      };
    },
  };
}

class Attempt < ApplicationRecord
  belongs_to :quiz
  has_many :answers, dependent: :destroy
  
  validates :sore, presence: true, numericality: { greater_than_or_equal_to: 0 }
  
  # Calculate score based on answers
  def calculate_score!
    total_questions = quiz.questions.count
    return 0 if total_questions == 0
    
    correct_answers = 0
    
    quiz.questions.each do |question|
      answer = answers.find_by(question_id: question.id)
      next unless answer
      
      if question.qtype == 'true_false'
        # For true/false, check if the selected option is correct
        selected_option = question.options.find_by(id: answer.response)
        correct_answers += 1 if selected_option&.correct
      elsif question.qtype == 'mcq'
        # For MCQ, check if the selected option is correct
        selected_option = question.options.find_by(id: answer.response)
        correct_answers += 1 if selected_option&.correct
      elsif question.qtype == 'text'
        # For text, compare the response with the correct answer (if option exists)
        correct_option = question.options.first
        if correct_option
          # Case-insensitive comparison
          correct_answers += 1 if answer.response&.strip&.downcase == correct_option.content&.strip&.downcase
        end
      end
    end
    
    self.sore = correct_answers
    save!
  end
end

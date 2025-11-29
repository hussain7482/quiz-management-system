class Question < ApplicationRecord
  belongs_to :quiz
  has_many :options, dependent: :destroy
  has_many :answers, dependent: :destroy
  
  validates :context, presence: true
  validates :qtype, presence: true, inclusion: { in: %w[true_false mcq text] }
  
  # For true/false questions, there should be exactly 2 options
  # For MCQ questions, there should be at least 2 options
  # For text questions, there should be no options (or one option with the correct answer text)
  validate :validate_options_based_on_type
  
  private
  
  def validate_options_based_on_type
    # Use size to include both persisted and new records
    options_count = options.size
    
    case qtype
    when 'true_false'
      if options_count != 2
        errors.add(:options, 'must have exactly 2 options for true/false questions')
      end
    when 'mcq'
      if options_count < 2
        errors.add(:options, 'must have at least 2 options for MCQ questions')
      end
      if options.none?(&:correct)
        errors.add(:options, 'must have at least one correct option for MCQ questions')
      end
    when 'text'
      # Text questions can have 0 or 1 option (the correct answer text)
      if options_count > 1
        errors.add(:options, 'text questions can have at most 1 option (the correct answer)')
      end
    end
  end
end

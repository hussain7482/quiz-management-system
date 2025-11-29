class Quiz < ApplicationRecord
    has_many :questions, dependent: :destroy
    has_many :attempts, dependent: :destroy
    
    validates :title, presence: true
end

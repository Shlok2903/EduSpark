const { Practice, Course, Enrollment } = require("../Models");
const axios = require("axios");
const mongoose = require("mongoose");

// Generate practice questions using OpenAI
const generatePracticeQuestions = async (req, res) => {
  try {
    const { courseId, difficulty, numberOfQuestions } = req.body;
    const userId = req.user.id;

    console.log("Generating practice with params:", {
      courseId,
      difficulty,
      numberOfQuestions,
      userId,
    });

    // Check if the user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      userId,
      courseId,
      isEnrolled: true,
    });

    if (!enrollment) {
      return res
        .status(400)
        .json({ message: "You are not enrolled in this course" });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Get previous practice sessions for this course to avoid duplicate questions
    const previousPractices = await Practice.find({
      userId,
      courseId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Extract previous questions
    let previousQuestions = [];
    previousPractices.forEach((practice) => {
      if (practice.questions && practice.questions.length > 0) {
        previousQuestions = [
          ...previousQuestions,
          ...practice.questions.map((q) => q.question),
        ];
      }
    });

    console.log(
      `Found ${previousQuestions.length} previous questions to avoid duplicates`
    );
    console.log("Found course for practice:", {
      title: course.title,
      description: course.description,
    });

    // Create a detailed difficulty definition
    const difficultyDefinition = {
      easy: "Basic understanding and recall of fundamental concepts. Questions should test basic knowledge, use simpler language, and have more obvious correct answers.",
      medium:
        "Application and analysis of concepts. Questions should require deeper understanding, involve application of concepts to scenarios, and have less obvious answer choices.",
      hard: "Evaluation, synthesis, and complex problem solving. Questions should challenge with advanced concepts, require critical thinking, and have nuanced answer choices that require careful analysis.",
    };

    // Generate questions using OpenAI API directly
    const prompt = `Generate ${numberOfQuestions} multiple-choice questions about ${
      course.title
    }. 
    The questions should be of ${difficulty} difficulty where:
    
    ${difficultyDefinition[difficulty]}
    
    Use the following course description as the main source of knowledge for questions: 
    "${course.description}"
    
    ${
      previousQuestions.length > 0
        ? `IMPORTANT: Do NOT generate any of these previously asked questions:
    ${previousQuestions
      .slice(0, 20)
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n")}
    `
        : ""
    }
    
    Create questions that:
    1. Test understanding of key concepts from this course
    2. Are relevant to the course content
    3. Vary in complexity based on the selected difficulty level
    4. Are unique and not repetitive or similar to the previous ones
    5. Include plausible distractors for wrong options
    
    Format each question with 4 options (A, B, C, D) and mark the correct answer.
    
    Format the response as a JSON array of question objects:
    [
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option that is correct (one of the options)"
      }
    ]`;

    // Make a direct API call to OpenAI
    try {
      const openAIResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 2500,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      let questionsData;
      try {
        const responseText =
          openAIResponse.data.choices[0].message.content.trim();
        questionsData = JSON.parse(responseText);
        console.log(questionsData);
      } catch (error) {
        console.error("Failed to parse AI-generated questions:", error);
        return res.status(500).json({
          message: "Failed to parse AI-generated questions",
          error: error.message,
        });
      }

      // Create new practice session
      const newPractice = new Practice({
        userId,
        courseId,
        title: `${course.title} Practice - ${
          difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
        }`,
        difficulty,
        numberOfQuestions,
        questions: questionsData,
      });

      await newPractice.save();

      // Return practice session with correct answers
      return res.status(201).json(newPractice);
    } catch (openAIError) {
      console.error(
        "OpenAI API error:",
        openAIError.response?.data || openAIError.message
      );
      return res.status(500).json({
        message: "Error generating questions with AI",
        error:
          openAIError.response?.data?.error?.message || openAIError.message,
      });
    }
  } catch (error) {
    console.error("Error generating practice:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get practice by ID
const getPracticeById = async (req, res) => {
  try {
    const { practiceId } = req.params;
    const userId = req.user.id;

    const practice = await Practice.findOne({
      _id: practiceId,
      userId,
    }).populate("courseId", "title description");

    if (!practice) {
      return res.status(404).json({ message: "Practice session not found" });
    }

    // If practice is not completed yet, don't send correct answers
    let responseData;
    if (!practice.isCompleted) {
      responseData = {
        ...practice.toObject(),
        questions: practice.questions.map((q) => ({
          _id: q._id,
          question: q.question,
          options: q.options,
          userAnswer: q.userAnswer,
        })),
      };
    } else {
      // Send full data including correct answers if completed
      responseData = practice;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching practice:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get all practices for a user
const getUserPractices = async (req, res) => {
  try {
    const userId = req.user.id;

    const practices = await Practice.find({ userId })
      .populate("courseId", "title description")
      .sort({ createdAt: -1 })
      .select("-questions");

    return res.status(200).json(practices);
  } catch (error) {
    console.error("Error fetching user practices:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Submit practice answers
const submitPracticeAnswers = async (req, res) => {
  try {
    const { practiceId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    console.log("Submitting practice answers:", { practiceId, answers });

    // Find the practice
    const practice = await Practice.findOne({
      _id: practiceId,
      userId,
    });

    if (!practice) {
      return res.status(404).json({ message: "Practice session not found" });
    }

    if (practice.isCompleted) {
      return res
        .status(400)
        .json({ message: "This practice session has already been completed" });
    }

    // Update questions with user answers
    let correctCount = 0;

    practice.questions = practice.questions.map((question, index) => {
      const answer = answers.find(
        (a) => a.questionId === question._id.toString()
      );

      if (answer) {
        const isCorrect = question.correctAnswer === answer.answer;
        if (isCorrect) correctCount++;

        return {
          ...question.toObject(),
          userAnswer: answer.answer,
          isCorrect,
        };
      }
      return question;
    });

    // Update practice session
    practice.correctAnswers = correctCount;
    practice.isCompleted = true;
    practice.completedAt = new Date();

    await practice.save();

    return res.status(200).json(practice);
  } catch (error) {
    console.error("Error submitting practice answers:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  generatePracticeQuestions,
  getPracticeById,
  getUserPractices,
  submitPracticeAnswers,
};

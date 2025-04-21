// Import models directly
const Practice = require("../Models/Practice");
const Course = require("../Models/Course");
const Enrollment = require("../Models/Enrollment");
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
          max_tokens: 7000,
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
        timeLimit: numberOfQuestions * 60, // 1 minute per question in seconds
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

    // Check if practice time has expired but not marked as completed
    if (!practice.isCompleted && practice.startTime) {
      const now = new Date();
      const startTime = new Date(practice.startTime);
      const timeLimit = practice.timeLimit;
      const endTime = new Date(startTime.getTime() + (timeLimit * 1000));
      
      // If end time is in the past, practice has expired
      if (now > endTime) {
        // Mark as auto-completed due to time expiry
        practice.isCompleted = true;
        practice.completedAt = now;
        practice.correctAnswers = practice.correctAnswers || 0;
        await practice.save();
        
        return res.status(200).json({
          ...practice.toObject(),
          timeExpired: true,
          message: "Practice time has expired"
        });
      }
      
      // Calculate remaining time
      const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
      practice.timeRemaining = remainingSeconds;
      await practice.save();
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
    console.log("Fetching practice history for user:", userId);

    // Use lean() for better performance since we don't need instance methods
    const practices = await Practice.find({ userId })
      .populate("courseId", "title description")
      .sort({ createdAt: -1 })
      .select("-questions")
      .lean();
    
    console.log(`Found ${practices.length} practices for user ${userId}`);
    
    // Transform the result slightly to ensure consistent format
    const transformedPractices = practices.map(practice => ({
      ...practice,
      _id: practice._id.toString(), // Ensure ID is a string
      courseId: practice.courseId ? {
        _id: practice.courseId._id?.toString(),
        title: practice.courseId.title || 'Unknown Course',
        description: practice.courseId.description || ''
      } : null
    }));

    return res.status(200).json(transformedPractices);
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

// Start a practice session
const startPractice = async (req, res) => {
  try {
    const { practiceId } = req.params;
    const userId = req.user.id;

    // Find the practice
    const practice = await Practice.findOne({
      _id: practiceId,
      userId,
    });

    if (!practice) {
      return res.status(404).json({ message: "Practice session not found" });
    }

    if (practice.isCompleted) {
      return res.status(200).json(practice);
    }

    // Set the start time if not already set
    if (!practice.startTime) {
      practice.startTime = new Date();
      await practice.save();
    } else {
      // If already started, calculate remaining time
      const now = new Date();
      const startTime = new Date(practice.startTime);
      const timeLimit = practice.timeLimit;
      
      // Calculate when the practice should end
      const endTime = new Date(startTime.getTime() + (timeLimit * 1000));
      
      // If end time is in the past, practice has expired
      if (now > endTime) {
        // Auto-complete practice if time has expired
        practice.isCompleted = true;
        practice.completedAt = now;
        // Set minimum score in case no answers were submitted
        practice.correctAnswers = practice.correctAnswers || 0;
        await practice.save();
        
        return res.status(200).json({
          ...practice.toObject(),
          timeExpired: true,
          message: "Practice time has expired"
        });
      }
      
      // Calculate remaining time in seconds
      const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
      practice.timeRemaining = remainingSeconds;
      await practice.save();
    }

    // Return practice with questions but without correct answers
    const responseData = {
      ...practice.toObject(),
      questions: practice.questions.map((q) => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        userAnswer: q.userAnswer,
      })),
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error starting practice:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update time remaining
const updateTimeRemaining = async (req, res) => {
  try {
    const { practiceId } = req.params;
    const { timeRemaining } = req.body;
    const userId = req.user.id;

    // Find the practice
    const practice = await Practice.findOne({
      _id: practiceId,
      userId,
    });

    if (!practice) {
      return res.status(404).json({ message: "Practice session not found" });
    }

    if (practice.isCompleted) {
      return res.status(400).json({ message: "This practice session is already completed" });
    }

    // Update time remaining
    practice.timeRemaining = timeRemaining;
    await practice.save();

    return res.status(200).json({ message: "Time updated successfully" });
  } catch (error) {
    console.error("Error updating time:", error);
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
  startPractice,
  updateTimeRemaining
};

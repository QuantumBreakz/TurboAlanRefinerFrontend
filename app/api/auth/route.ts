import { NextRequest, NextResponse } from "next/server"

// Import dependencies safely
let bcrypt: any = null
let jwt: any = null

try {
  bcrypt = require("bcryptjs")
  jwt = require("jsonwebtoken")
  console.log("Auth dependencies loaded successfully")
} catch (error) {
  console.error("Failed to load auth dependencies:", error)
}

// Check if Supabase is configured
let supabase: any = null

try {
  const supabaseModule = require("@/lib/supabase")
  supabase = supabaseModule.supabase
  console.log("Supabase configured successfully")
} catch (error) {
  console.warn("Supabase not configured, using fallback authentication:", error instanceof Error ? error.message : "Unknown error")
  supabase = null
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

interface SignupRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  settings: {
    openaiApiKey: string
    openaiModel: string
    targetScannerRisk: number
    minWordRatio: number
  }
}

interface SigninRequest {
  email: string
  password: string
}

interface GoogleSigninRequest {
  email: string
  firstName: string
  lastName: string
  googleId: string
  avatarUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("Auth API called")
    const body = await request.json()
    console.log("Request body:", body)
    const { action } = body

    if (action === "signup") {
      console.log("Handling signup")
      return await handleSignup(body as SignupRequest)
    } else if (action === "signin") {
      console.log("Handling signin")
      return await handleSignin(body as SigninRequest)
    } else if (action === "google_signin") {
      console.log("Handling Google signin")
      return await handleGoogleSignin(body as GoogleSigninRequest)
    } else {
      console.log("Invalid action:", action)
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Auth API error:", error)
    return NextResponse.json({ 
      error: "Authentication failed", 
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 })
  }
}

async function handleSignup(data: SignupRequest) {
  console.log("handleSignup called with data:", data)
  const { firstName, lastName, email, password, settings } = data

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    console.log("Validation failed: missing required fields")
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    console.log("Validation failed: invalid email format")
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
  }

  // Validate password strength
  if (password.length < 8) {
    console.log("Validation failed: password too short")
    return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
  }

  // Validate OpenAI API key (optional)
  if (settings.openaiApiKey && !settings.openaiApiKey.startsWith("sk-")) {
    console.log("Validation failed: invalid OpenAI API key format")
    return NextResponse.json({ error: "OpenAI API Key must start with 'sk-' if provided" }, { status: 400 })
  }

  try {
    console.log("Supabase available:", !!supabase)
    if (supabase) {
      // Use Supabase authentication
      console.log("Using Supabase authentication")
      return await handleSignupWithSupabase(data)
    } else {
      // Use fallback authentication
      console.log("Using fallback authentication")
      return await handleSignupFallback(data)
    }
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}

async function handleSignupWithSupabase(data: SignupRequest) {
  const { firstName, lastName, email, password, settings } = data

  // Check if user already exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existingUser) {
    return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user in Supabase
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      settings: {
        openai_api_key: settings.openaiApiKey || "",
        openai_model: settings.openaiModel,
        target_scanner_risk: settings.targetScannerRisk,
        min_word_ratio: settings.minWordRatio,
      },
      role: 'user',
      is_active: true
    })
    .select()
    .single()

  if (insertError) {
    console.error("Supabase insert error:", insertError)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }

  // System log: signup
  try {
    await supabase.from('system_logs').insert({
      user_id: newUser.id,
      action: 'signup',
      details: 'User signed up via API',
    })
  } catch {}

  // Generate JWT token
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  // Return user data (without password)
  const userResponse = {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.first_name,
    lastName: newUser.last_name,
    settings: newUser.settings,
    createdAt: newUser.created_at,
    role: newUser.role,
    isActive: newUser.is_active
  }

  return NextResponse.json({
    success: true,
    user: userResponse,
    token,
    message: "Account created successfully"
  })
}

async function handleSignupFallback(data: SignupRequest) {
  console.log("handleSignupFallback called with data:", data)
  const { firstName, lastName, email, password, settings } = data

  try {
    // Generate a simple user ID
    // Generate a proper UUID for the user ID (database expects UUID format)
    const userId = crypto.randomUUID()
    console.log("Generated userId:", userId)
    
    // Hash password if bcrypt is available
    let hashedPassword = password // fallback to plain text if bcrypt fails
    if (bcrypt) {
      try {
        console.log("Hashing password...")
        hashedPassword = await bcrypt.hash(password, 12)
        console.log("Password hashed successfully")
      } catch (hashError) {
        console.warn("Password hashing failed, using plain text:", hashError)
        hashedPassword = password
      }
    } else {
      console.warn("bcrypt not available, using plain text password")
    }

    // Create user object
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      settings: {
        openai_api_key: settings.openaiApiKey || "",
        openai_model: settings.openaiModel,
        target_scanner_risk: settings.targetScannerRisk,
        min_word_ratio: settings.minWordRatio,
      },
      created_at: new Date().toISOString(),
      role: 'user',
      is_active: true
    }
    console.log("Created user object:", newUser)

    // Generate JWT token if jwt is available
    let token = "fallback-token"
    if (jwt) {
      try {
        console.log("Generating JWT token...")
        token = jwt.sign(
          { userId: newUser.id, email: newUser.email },
          JWT_SECRET,
          { expiresIn: "7d" }
        )
        console.log("JWT token generated successfully")
      } catch (jwtError) {
        console.warn("JWT generation failed, using fallback token:", jwtError)
        token = "fallback-token"
      }
    } else {
      console.warn("jwt not available, using fallback token")
    }

    // Return user data (without password)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      settings: newUser.settings,
      createdAt: newUser.created_at,
      role: newUser.role,
      isActive: newUser.is_active
    }

    console.log("Returning success response")
    return NextResponse.json({
      success: true,
      user: userResponse,
      token,
      message: "Account created successfully (fallback mode)"
    })
  } catch (error) {
    console.error("Error in handleSignupFallback:", error)
    return NextResponse.json({ 
      error: "Failed to create account", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

async function handleSignin(data: SigninRequest) {
  const { email, password } = data

  // Validate required fields
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  try {
    if (supabase) {
      // Use Supabase authentication
      return await handleSigninWithSupabase(data)
    } else {
      // Use fallback authentication
      return await handleSigninFallback(data)
    }
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}

async function handleSigninWithSupabase(data: SigninRequest) {
  const { email, password } = data

  // Find user in Supabase
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single()

  if (fetchError || !user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash)
  if (!isValidPassword) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  // Update last_login_at
  try {
    await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id)
  } catch {}

  // System log: signin
  try {
    await supabase.from('system_logs').insert({
      user_id: user.id,
      action: 'signin',
      details: 'User signed in via API',
    })
  } catch {}

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  // Return user data (without password)
  const userResponse = {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    settings: user.settings,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    role: user.role,
    isActive: user.is_active
  }

  return NextResponse.json({
    success: true,
    user: userResponse,
    token,
    message: "Sign in successful"
  })
}

async function handleSigninFallback(data: SigninRequest) {
  const { email, password } = data

  // For fallback mode, we'll create a simple user if they don't exist
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Generate JWT token
  let token = "fallback-token"
  if (jwt) {
    try {
      token = jwt.sign(
        { userId, email: email.toLowerCase() },
        JWT_SECRET,
        { expiresIn: "7d" }
      )
    } catch (jwtError) {
      console.warn("JWT generation failed:", jwtError)
    }
  }

  // Return user data
  const userResponse = {
    id: userId,
    email: email.toLowerCase(),
    firstName: "Demo",
    lastName: "User",
    settings: {
      openai_api_key: "",
      openai_model: "gpt-4",
      target_scanner_risk: 15,
      min_word_ratio: 0.8,
    },
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    role: 'user',
    isActive: true
  }

  return NextResponse.json({
    success: true,
    user: userResponse,
    token,
    message: "Sign in successful (fallback mode)"
  })
}

async function handleGoogleSignin(data: GoogleSigninRequest) {
  const { email, firstName, lastName, googleId, avatarUrl } = data

  // Validate required fields
  if (!email || !googleId) {
    return NextResponse.json({ error: "Email and Google ID are required" }, { status: 400 })
  }

  try {
    if (supabase) {
      // Use Supabase authentication
      return await handleGoogleSigninWithSupabase(data)
    } else {
      // Use fallback authentication
      return await handleGoogleSigninFallback(data)
    }
  } catch (error) {
    console.error("Google signin error:", error)
    return NextResponse.json({ error: "Failed to sign in with Google" }, { status: 500 })
  }
}

async function handleGoogleSigninWithSupabase(data: GoogleSigninRequest) {
  const { email, firstName, lastName, googleId, avatarUrl } = data

  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  let user

  if (fetchError || !existingUser) {
    // Create new user
    // Generate a proper UUID for the user ID (database expects UUID format)
    const userId = crypto.randomUUID()
    
    // Build insert object with only required columns first
    const insertData: any = {
      id: userId,
      email: email.toLowerCase(),
      first_name: firstName || '',
      last_name: lastName || '',
      password_hash: '', // No password for Google OAuth users
      is_active: true,
      role: 'user',
      settings: {},
    }
    
    // Try inserting with optional columns first
    let insertWithOptional = { ...insertData }
    if (googleId) {
      insertWithOptional.google_id = googleId
    }
    if (avatarUrl) {
      insertWithOptional.avatar_url = avatarUrl
    }
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(insertWithOptional)
      .select()
      .single()

    if (insertError) {
      console.error("Failed to create user:", insertError)
      // If it's a column error, try without optional columns
      const errorMsg = insertError.message || ''
      if (errorMsg.includes('avatar_url') || errorMsg.includes('google_id')) {
        // Retry with only required columns (no optional columns)
        const { data: retryUser, error: retryError } = await supabase
          .from('users')
          .insert(insertData)
          .select()
          .single()
        
        if (retryError) {
          console.error("Failed to create user (retry):", retryError)
          return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
        }
        user = retryUser
      } else {
        return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
      }
    } else {
      user = newUser
    }
  } else {
    // Update existing user - only update columns that exist
    const updateData: any = {
      last_login_at: new Date().toISOString(),
    }
    
    // Try to update optional columns, but handle errors gracefully
    // First try with optional columns
    let updateWithOptional = { ...updateData }
    if (googleId && !existingUser.google_id) {
      updateWithOptional.google_id = googleId
    }
    if (avatarUrl) {
      updateWithOptional.avatar_url = avatarUrl
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateWithOptional)
      .eq('id', existingUser.id)
      .select()
      .single()

    if (updateError) {
      // If update fails due to missing columns, try without optional columns
      const errorMsg = updateError.message || ''
      if (errorMsg.includes('avatar_url') || errorMsg.includes('google_id')) {
        // Retry with only required columns
        const { data: retryUser, error: retryError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', existingUser.id)
          .select()
          .single()
        
        if (retryError) {
          console.warn("Failed to update user (non-critical):", retryError.message)
          user = existingUser
        } else {
          user = retryUser || existingUser
        }
      } else {
        // Other error - log but continue with existing user
        console.warn("Failed to update user (non-critical):", updateError.message)
        user = existingUser
      }
    } else {
      user = updatedUser || existingUser
    }
  }

  // System log: signin
  try {
    await supabase.from('system_logs').insert({
      user_id: user.id,
      action: 'google_signin',
      details: 'User signed in via Google OAuth',
    })
  } catch {}

  // Ensure user exists before accessing properties
  if (!user) {
    return NextResponse.json({ error: "User creation/login failed" }, { status: 500 })
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  // Return user data (without password)
  const userResponse = {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar_url || avatarUrl || undefined, // Fallback to provided avatarUrl if column doesn't exist
    settings: user.settings || {},
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    role: user.role || 'user',
    isActive: user.is_active !== undefined ? user.is_active : true
  }

  return NextResponse.json({
    success: true,
    user: userResponse,
    token,
    message: "Sign in successful"
  })
}

async function handleGoogleSigninFallback(data: GoogleSigninRequest) {
  const { email, firstName, lastName, googleId, avatarUrl } = data

  // For fallback mode, create a simple user if they don't exist
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Generate JWT token
  let token = "fallback-token"
  if (jwt) {
    try {
      token = jwt.sign(
        { userId, email: email.toLowerCase(), googleId },
        JWT_SECRET,
        { expiresIn: "7d" }
      )
    } catch (error) {
      console.error("JWT signing error:", error)
    }
  }

  const userResponse = {
    id: userId,
    email: email.toLowerCase(),
    firstName: firstName || '',
    lastName: lastName || '',
    avatarUrl: avatarUrl,
    settings: {},
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    role: 'user',
    isActive: true
  }

  return NextResponse.json({
    success: true,
    user: userResponse,
    token,
    message: "Sign in successful"
  })
}

// Get user profile (requires authentication)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }

    if (supabase) {
      // Use Supabase authentication
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single()

      if (fetchError || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Return user data (without password)
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        settings: user.settings,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        role: user.role,
        isActive: user.is_active
      }

      return NextResponse.json({ user: userResponse })
    } else {
      // Use fallback authentication
      const userResponse = {
        id: decoded.userId,
        email: decoded.email,
        firstName: "Demo",
        lastName: "User",
        settings: {
          openai_api_key: "",
          openai_model: "gpt-4",
          target_scanner_risk: 15,
          min_word_ratio: 0.8,
        },
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'user',
        isActive: true
      }

      return NextResponse.json({ user: userResponse })
    }

  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }
}
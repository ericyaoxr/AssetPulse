import { Component, type ReactNode } from "react"
import { Activity } from "lucide-react"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <Activity className="h-12 w-12 text-accent animate-pulse" />
            <div>
              <p className="font-mono text-xl font-bold tracking-tight text-content-primary">
                Asset<span className="text-accent">Pulse</span>
              </p>
              <p className="mt-2 text-sm text-content-secondary">页面出现了错误</p>
              <p className="mt-1 text-xs text-content-muted">{this.state.error?.message}</p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

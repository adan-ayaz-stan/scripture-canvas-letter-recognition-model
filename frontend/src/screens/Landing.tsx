import PrismaticBurst from "@/components/PrismaticBurst";
import {
  Eraser,
  GraduationCap,
  Info,
  Layers,
  Loader2,
  RefreshCcw,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import React, { useRef, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import DrawingCanvas, {
  type DrawingCanvasRef,
} from "../components/canvas/DrawingCanvas";
import MetricChart from "../components/MetricChart";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { dataURItoBlob, predictLetter } from "../lib/api";
import { extractLetters, type ProcessedLetter } from "../lib/imageProcessor";

interface PredictedLetter extends ProcessedLetter {
  prediction: string;
  confidence: number;
  metrics: Record<string, number>;
}

const teamData = [
  { name: "Adan", role: "Model Architecture", value: 25 },
  { name: "Usman", role: "Backend API", value: 25 },
  { name: "Azka", role: "Frontend UI", value: 25 },
  { name: "Yumnah", role: "Data Processing", value: 25 },
];

const COLORS = ["#8884d8", "#00C49F", "#FFBB28", "#FF8042"];

const Landing: React.FC = () => {
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [letters, setLetters] = useState<PredictedLetter[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClear = () => {
    canvasRef.current?.clear();
    setLetters([]);
    setError(null);
  };

  const handleGuess = async () => {
    if (!canvasRef.current) return;
    if (canvasRef.current.isEmpty()) {
      setError("Please draw something first!");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setLetters([]);

    try {
      const canvas = canvasRef.current.getCanvas();
      if (canvas) {
        // 1. Extract letters from canvas
        const extracted = await extractLetters(canvas);

        if (extracted.length === 0) {
          setError("No distinct letters found. Try drawing clearer lines.");
          setIsProcessing(false);
          return;
        }

        // 2. Process each letter with the backend API
        const predictedLetters: PredictedLetter[] = [];

        for (const letter of extracted) {
          const blob = dataURItoBlob(letter.imageUrl);
          try {
            const response = await predictLetter(blob);
            predictedLetters.push({
              ...letter,
              prediction: response.prediction,
              confidence: response.confidence,
              metrics: response.metrics,
            });
          } catch (apiError) {
            console.error("API Error for letter:", apiError);
            // Fallback or error handling for individual letter failure
            predictedLetters.push({
              ...letter,
              prediction: "?",
              confidence: 0,
              metrics: {},
            });
          }
        }

        setLetters(predictedLetters);
      }
    } catch (err) {
      console.error(err);
      setError(
        "An error occurred while processing the image. Is the backend running?"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-cover bg-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full inset-0">
          <PrismaticBurst
            animationType="rotate3d"
            intensity={2}
            speed={0.5}
            distort={1.0}
            paused={false}
            offset={{ x: 0, y: 0 }}
            hoverDampness={0.25}
            rayCount={24}
            mixBlendMode="lighten"
            colors={["#ff007a", "#4d3dff", "#ffffff"]}
          />
        </div>

        {/* Content Wrapper (Ensure z-10 is kept so text sits on top of the overlay) */}
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <img
            src="/logo.png"
            alt="Scripture Logo"
            className="h-80 -my-24 mx-auto mb-4"
          />

          <h1 className="text-5xl font-extrabold tracking-tight lg:text-7xl text-primary drop-shadow-sm">
            Scripture
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transforming your handwriting into digital text with the power of{" "}
            <span className="text-foreground font-semibold">Robust CNNs</span>.
          </p>

          <div className="pt-4 flex justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-8"
              onClick={() =>
                document
                  .getElementById("canvas-area")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Try It Now <Zap className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8"
              onClick={() =>
                document
                  .getElementById("about-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <main className="flex-grow bg-gradient-to-b from-black to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 py-12">
          {/* Main Canvas Area */}
          <section id="canvas-area" className="scroll-mt-24 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">
                Interactive Demo
              </h2>
              <p className="text-muted-foreground">
                Draw a word below and watch the AI interpret it in real-time.
              </p>
            </div>

            <Card className="w-full border-2 shadow-2xl overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Drawing Board
                </CardTitle>
                <CardDescription>
                  Use your mouse or touch input. Write clearly for best results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="w-full flex justify-center bg-white rounded-xl p-4 border-2 border-dashed border-muted-foreground/20 hover:border-primary/20 transition-colors shadow-inner">
                  <DrawingCanvas
                    ref={canvasRef}
                    width={Math.min(window.innerWidth - 90, 700)}
                    height={300}
                    className="cursor-crosshair shadow-sm ring-1 ring-black/5"
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 font-medium flex items-center justify-center animate-in fade-in slide-in-from-top-1">
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-4 justify-center pb-8 bg-muted/30 pt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="w-32"
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  size="lg"
                  onClick={handleGuess}
                  disabled={isProcessing}
                  className="w-40"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Guess Word
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Results Area */}
            {letters.length > 0 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between border-b pb-4">
                  <h2 className="text-3xl font-bold tracking-tight">
                    Inference Results
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLetters([])}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {/* Combined Interpretation - Priority 1 */}
                <Card className="bg-gradient-to-r from-primary/10 via-background to-primary/5 border-primary/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-center text-muted-foreground uppercase tracking-widest text-sm font-semibold">
                      Combined Interpretation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-8">
                    <p className="text-6xl sm:text-8xl font-black tracking-[0.1em] text-primary drop-shadow-md">
                      {letters.map((l) => l.prediction).join("")}
                    </p>
                  </CardContent>
                </Card>

                {/* Details - Priority 2 */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-muted-foreground">
                    Character Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {letters.map((letter, idx) => (
                      <Card
                        key={letter.id}
                        className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-primary/10 flex flex-col group"
                      >
                        <div className="flex flex-row h-40">
                          <div className="w-1/2 bg-white p-4 flex items-center justify-center border-r relative group-hover:bg-muted/20 transition-colors">
                            <img
                              src={letter.imageUrl}
                              alt={`Letter ${idx + 1}`}
                              className="max-h-full max-w-full object-contain drop-shadow-md"
                            />
                            <div className="absolute top-2 left-2 text-xs font-mono text-muted-foreground opacity-50">
                              #{idx + 1}
                            </div>
                          </div>
                          <div className="w-1/2 flex items-center justify-center bg-card">
                            <div className="text-center">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Prediction
                              </p>
                              <p className="text-5xl font-black text-primary">
                                {letter.prediction}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted px-2 py-0.5 rounded-full inline-block">
                                {(letter.confidence * 100).toFixed(1)}% Conf.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="border-t bg-muted/30 p-2 flex-grow">
                          <MetricChart
                            metrics={letter.metrics}
                            prediction={letter.prediction}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* About The Model */}
          <section id="about-section" className="space-y-8 py-12 border-t">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Layers className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                About The Model
              </h2>
              <p className="text-muted-foreground">
                Scripture is powered by a custom-trained Convolutional Neural
                Network (CNN) specifically designed for robust character
                recognition.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <Card>
                <CardHeader>
                  <CardTitle>Dataset</CardTitle>
                </CardHeader>
                <CardContent>
                  Trained on the <strong>EMNIST Letters</strong> dataset,
                  containing over 145,000 samples of handwritten characters. The
                  model learns from a diverse range of handwriting styles.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  A <strong>Robust CNN</strong> with 3 convolutional blocks.
                  Features include Batch Normalization for stability, Max
                  Pooling for spatial reduction, and Dropout to prevent
                  overfitting.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Training</CardTitle>
                </CardHeader>
                <CardContent>
                  Optimized using the <strong>Adam</strong> optimizer. The model
                  utilizes data augmentation (rotation, zoom, translation) to
                  handle real-world variations in user input.
                </CardContent>
              </Card>
            </div>
          </section>

          {/* The Team */}
          <section className="space-y-8 py-12 border-t">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">The Team</h2>
              <p className="text-muted-foreground">
                The brilliant minds behind Scripture.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-12 bg-card p-8 rounded-2xl border shadow-sm">
              <div className="w-full md:w-1/2 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={teamData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {teamData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 grid grid-cols-1 gap-4">
                {teamData.map((member, index) => (
                  <div
                    key={member.name}
                    className="flex items-center p-4 rounded-lg bg-muted/50 border hover:bg-muted transition-colors"
                  >
                    <div
                      className="w-3 h-12 rounded-full mr-4"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div>
                      <p className="font-bold text-lg">{member.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t py-12 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Info className="w-4 h-4" />
              Did you know?
            </div>
            <p className="text-muted-foreground max-w-lg mx-auto italic">
              "The EMNIST dataset contains characters from thousands of
              different writers, making it much harder—and more realistic—than
              the standard digit-only MNIST dataset!"
            </p>
          </div>

          <div className="pt-8 border-t border-border/40">
            <div className="flex items-center justify-center gap-2 mb-2 text-primary font-semibold">
              <GraduationCap className="w-5 h-5" />
              Semester 3 Project: Programming with AI
            </div>
            <p className="text-sm text-muted-foreground">
              "Bridging the gap between human expression and machine
              understanding."
            </p>
            <p className="text-xs text-muted-foreground/50 mt-8">
              © {new Date().getFullYear()} Scripture Team. Built with React &
              TensorFlow.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
